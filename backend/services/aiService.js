/**
 * AI Service for IRMS
 *
 * Uses configured AI provider (via OPENAI_API_KEY or GEMINI_API_KEY) when available.
 * Falls back to deterministic rule-based demo mode when credentials are missing.
 */

const https = require('https');

// ── Demo fallback rules ───────────────────────────────────────────────────────

const DEMO_DATA = {
  Phishing: {
    attack_type: 'Phishing / Social Engineering',
    summary_template: (inc) => `This incident appears to involve a phishing attempt targeting ${inc.affected_user || 'one or more users'}. The attacker may be attempting to harvest credentials or deliver malware via deceptive communications.`,
    findings: [
      'Suspicious communication was received that impersonates a trusted entity.',
      'The incident involves user interaction with potentially malicious content.',
      'Social engineering techniques are likely being used to bypass technical controls.',
    ],
    recommendations: [
      'Collect and analyse the original message headers to trace the sender.',
      'Identify all recipients of the suspicious communication.',
      'Verify whether any user clicked the link or submitted credentials.',
      'Block the identified malicious domain or sender at the email gateway.',
      'Notify affected users and provide immediate guidance on credential safety.',
    ],
    evidence_to_collect: [
      'Original message headers (email or text).',
      'Screenshot of the suspicious content or landing page.',
      'List of all recipients from mail server logs.',
      'Proxy or DNS logs for accesses to the suspected domain.',
      'User confirmation of any action taken (link clicked, credentials entered).',
    ],
  },
  Malware: {
    attack_type: 'Malware Infection',
    summary_template: (inc) => `A malware infection has been detected on ${inc.affected_asset || 'an endpoint'}. The malware may be attempting to establish persistence, exfiltrate data, or communicate with a remote command-and-control server.`,
    findings: [
      'Malicious software was detected on the affected asset.',
      'The malware may be attempting to communicate with external infrastructure.',
      'User data and system integrity on the affected asset are potentially compromised.',
    ],
    recommendations: [
      'Immediately isolate the affected device from the network.',
      'Collect a forensic image of the affected system before remediation.',
      'Identify the malware family and behaviour using threat intelligence sources.',
      'Block any identified C2 IP addresses or domains at the perimeter firewall.',
      'Scan other endpoints for the same indicators of compromise (IOCs).',
    ],
    evidence_to_collect: [
      'File hash (MD5, SHA256) of the malicious file.',
      'Endpoint protection alert details and logs.',
      'Network connection logs showing C2 communication attempts.',
      'Process tree or memory dump if available.',
      'List of recently modified files on the affected system.',
    ],
  },
  'Brute Force': {
    attack_type: 'Credential Brute Force Attack',
    summary_template: (inc) => `Multiple failed authentication attempts have been detected targeting ${inc.affected_user || 'one or more accounts'}. This pattern is consistent with automated credential stuffing or brute-force activity.`,
    findings: [
      'A high volume of failed authentication attempts was recorded in a short time window.',
      'The activity originates from one or more external IP addresses.',
      'The pattern suggests automated credential-guessing tools may be in use.',
    ],
    recommendations: [
      'Review authentication logs to confirm the scope and source of the attempts.',
      'Block the offending IP address or IP range at the perimeter firewall.',
      'Verify whether any authentication attempts were successful.',
      'Reset credentials for any accounts that may have been compromised.',
      'Enforce multi-factor authentication on the targeted service if not already in place.',
    ],
    evidence_to_collect: [
      'Authentication log extract covering the incident time window.',
      'Source IP addresses involved in the failed attempts.',
      'Account names targeted in the authentication attempts.',
      'Geolocation and reputation data for the source IPs.',
      'Successful login records (if any) following the failed attempts.',
    ],
  },
  'Suspicious Login': {
    attack_type: 'Account Compromise / Credential Abuse',
    summary_template: (inc) => `A login to ${inc.affected_user || 'a user account'} has been flagged as suspicious based on unusual location, device, or time of access. This may indicate account compromise or credential sharing.`,
    findings: [
      'Login activity occurred outside the user\'s normal geographic region or time pattern.',
      'The access may be the result of compromised credentials.',
      'Simultaneous or near-simultaneous logins from different locations may be present.',
    ],
    recommendations: [
      'Contact the account owner to verify whether the login was authorised.',
      'Review activity performed after the suspicious login for signs of data access or modification.',
      'Temporarily suspend the account if the login cannot be verified as legitimate.',
      'Reset account credentials and active sessions if compromise is confirmed.',
      'Review MFA configuration and enforce re-enrolment if credentials were compromised.',
    ],
    evidence_to_collect: [
      'Login record including timestamp, source IP, and geolocation.',
      'Account activity log covering the period after the suspicious login.',
      'Previous login history for comparison.',
      'Device and user-agent information from the login session.',
      'MFA event log to determine whether secondary authentication was used.',
    ],
  },
  'Data Breach': {
    attack_type: 'Data Exfiltration / Insider Threat',
    summary_template: (inc) => `A potential data breach has been identified involving ${inc.affected_asset || 'sensitive data'}. Significant volumes of data may have been transferred to an unauthorised destination.`,
    findings: [
      'Unusually large data transfers have been detected from a monitored system or account.',
      'The destination of the transfer is outside of authorised corporate infrastructure.',
      'The files involved may contain sensitive, confidential, or regulated data.',
    ],
    recommendations: [
      'Immediately suspend access for the account associated with the transfer.',
      'Identify and catalogue exactly which files or data were transferred.',
      'Block the destination domain or storage service to prevent further exfiltration.',
      'Notify legal, compliance, and management teams as required by policy.',
      'Preserve all relevant logs and evidence for forensic investigation and regulatory reporting.',
    ],
    evidence_to_collect: [
      'DLP alert details including file names, sizes, and destination.',
      'Network flow logs showing data transfer volume and endpoint.',
      'List of sensitive files accessed in the period preceding the incident.',
      'User activity logs and access history for the account involved.',
      'Cloud storage provider access logs if available.',
    ],
  },
  'Unauthorized Access': {
    attack_type: 'Unauthorised Access Attempt',
    summary_template: (inc) => `Unauthorised access or access attempts have been detected targeting ${inc.affected_asset || 'a protected system'}. This may indicate an external attack or insider misuse.`,
    findings: [
      'Access to a restricted system or resource was attempted or achieved without authorisation.',
      'The source of the access is external to the organisation or outside expected user behaviour.',
      'Critical assets may be at risk if access controls have been bypassed.',
    ],
    recommendations: [
      'Review access control lists and verify that permissions are correctly configured.',
      'Block the identified source IP or account from further access attempts.',
      'Check audit logs to determine what resources were accessed.',
      'Patch any identified vulnerabilities in the targeted system.',
      'Review and strengthen access controls for the affected asset.',
    ],
    evidence_to_collect: [
      'Access and authentication logs for the affected system.',
      'Source IP addresses and associated network traffic.',
      'User account activity logs.',
      'System vulnerability scan results.',
      'Firewall and IDS logs covering the incident time window.',
    ],
  },
  Ransomware: {
    attack_type: 'Ransomware Attack',
    summary_template: (inc) => `Ransomware activity has been detected on ${inc.affected_asset || 'one or more systems'}. Files may be encrypted and systems may be unavailable. Immediate containment is critical.`,
    findings: [
      'File encryption or mass renaming consistent with ransomware behaviour has been detected.',
      'Multiple users or systems may be affected.',
      'A ransom demand may have been displayed or delivered.',
    ],
    recommendations: [
      'Immediately isolate all affected systems from the network to prevent further spread.',
      'Identify the ransomware family using known signatures or behavioural indicators.',
      'Contact your incident response team and notify management immediately.',
      'Do NOT pay the ransom without consulting legal and management — payment is not guaranteed to restore access.',
      'Initiate restoration from the most recent clean backup after confirming the environment is secure.',
    ],
    evidence_to_collect: [
      'List of encrypted or renamed files and their original locations.',
      'Ransomware note or demand if present.',
      'File hash of the ransomware executable if identified.',
      'Process and network activity logs from the affected systems.',
      'Backup status and integrity verification.',
    ],
  },
  Other: {
    attack_type: 'Security Incident (Type Under Investigation)',
    summary_template: (inc) => `A security incident has been reported involving ${inc.affected_asset || 'a system or resource'}. The incident type requires further investigation to classify accurately.`,
    findings: [
      'Anomalous activity has been observed that requires further investigation.',
      'The full scope and impact of the incident are not yet determined.',
    ],
    recommendations: [
      'Gather initial evidence and context to classify the incident type accurately.',
      'Review recent activity on affected systems and accounts.',
      'Determine whether the incident is isolated or part of a broader pattern.',
      'Notify relevant stakeholders based on initial severity assessment.',
      'Consult threat intelligence sources for similar reported incidents.',
    ],
    evidence_to_collect: [
      'System and application logs covering the incident time window.',
      'Details of any anomalous activity observed.',
      'Affected user and asset information.',
      'Network traffic logs if available.',
    ],
  },
};

function getDemoAnalysis(incident) {
  const type = incident.incident_type || 'Other';
  const template = DEMO_DATA[type] || DEMO_DATA['Other'];

  const summary = template.summary_template(incident);

  let confidence = 'The analysis is based on the information provided in the incident record. ';
  if (!incident.description || incident.description.length < 50) {
    confidence += 'The incident description is brief; adding more detail will improve analysis accuracy. ';
  }
  if (!incident.affected_user || incident.affected_user === 'N/A') {
    confidence += 'No affected user has been identified; this limits account-specific analysis. ';
  }
  confidence += 'This is a rule-based demo analysis, not a live AI assessment. Findings are based on the incident type and should be verified against actual evidence.';

  const riskCategory = incident.risk_score >= 81 ? 'Critical' :
    incident.risk_score >= 61 ? 'High' :
      incident.risk_score >= 31 ? 'Medium' : 'Low';

  const riskExplanation = `The incident has a risk score of ${incident.risk_score}/100 (${riskCategory}). ` +
    `This reflects the ${incident.severity} severity, the importance of the affected asset, ` +
    `potential impact on operations, and threat confidence level. ` +
    `Incidents of this type can cause significant harm if not contained promptly.`;

  return {
    provider_mode: 'demo',
    summary,
    attack_type: template.attack_type,
    risk_explanation: riskExplanation,
    findings: template.findings,
    recommendations: template.recommendations,
    evidence_to_collect: template.evidence_to_collect,
    confidence_notes: confidence,
  };
}

// ── Real AI call (Google Gemini) ──────────────────────────────────────────────

async function callGemini(apiKey, prompt) {
  const model = process.env.AI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
    });

    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          resolve(text);
        } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('AI request timed out')); });
    req.write(body);
    req.end();
  });
}

// ── OpenAI call ───────────────────────────────────────────────────────────────

async function callOpenAI(apiKey, prompt) {
  const model = process.env.AI_MODEL || 'gpt-3.5-turbo';
  const url = 'https://api.openai.com/v1/chat/completions';

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a cybersecurity incident analyst assistant. Provide structured, practical analysis.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          const text = parsed?.choices?.[0]?.message?.content || '';
          resolve(text);
        } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('AI request timed out')); });
    req.write(body);
    req.end();
  });
}

function buildIncidentPrompt(incident, notes, evidenceList) {
  const notesText = notes.length > 0
    ? notes.map(n => `- ${n.note}`).join('\n')
    : 'No investigation notes yet.';

  const evidenceText = evidenceList.length > 0
    ? evidenceList.map(e => `- [${e.evidence_type}] ${e.name}: ${e.description || ''}`).join('\n')
    : 'No evidence recorded yet.';

  return `You are a cybersecurity analyst. Analyse the following security incident and provide a structured response.

INCIDENT DETAILS:
- ID: ${incident.incident_code}
- Title: ${incident.title}
- Type: ${incident.incident_type}
- Severity: ${incident.severity}
- Risk Score: ${incident.risk_score}/100
- Affected Asset: ${incident.affected_asset || 'Unknown'}
- Affected User: ${incident.affected_user || 'Unknown'}
- Description: ${incident.description}

INVESTIGATION NOTES:
${notesText}

EVIDENCE COLLECTED:
${evidenceText}

Please respond with a JSON object containing these exact fields:
{
  "summary": "2-4 sentence summary of what may have happened",
  "attack_type": "Identified or suspected attack type",
  "risk_explanation": "Explanation of the risk level based on available information",
  "findings": ["Finding 1", "Finding 2", "Finding 3"],
  "recommendations": ["Action 1", "Action 2", "Action 3", "Action 4", "Action 5"],
  "evidence_to_collect": ["Evidence item 1", "Evidence item 2", "Evidence item 3"],
  "confidence_notes": "Assessment of information completeness and confidence in the analysis"
}

Be practical, specific to the incident details, and avoid generic statements. If information is insufficient, say so clearly in confidence_notes.`;
}

function parseAIResponse(text) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || '',
        attack_type: parsed.attack_type || '',
        risk_explanation: parsed.risk_explanation || '',
        findings: Array.isArray(parsed.findings) ? parsed.findings : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        evidence_to_collect: Array.isArray(parsed.evidence_to_collect) ? parsed.evidence_to_collect : [],
        confidence_notes: parsed.confidence_notes || '',
      };
    }
  } catch (_) {}

  // Fallback: return raw text
  return {
    summary: text.substring(0, 500),
    attack_type: 'Unable to parse structured response',
    risk_explanation: '',
    findings: [],
    recommendations: [],
    evidence_to_collect: [],
    confidence_notes: 'The AI response could not be parsed into structured format.',
  };
}

async function runAIAnalysis(incident, notes, evidenceList) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    try {
      const prompt = buildIncidentPrompt(incident, notes, evidenceList);
      const text = await callGemini(geminiKey, prompt);
      const parsed = parseAIResponse(text);
      return { ...parsed, provider_mode: 'gemini' };
    } catch (err) {
      console.error('Gemini AI call failed:', err.message);
    }
  }

  if (openaiKey) {
    try {
      const prompt = buildIncidentPrompt(incident, notes, evidenceList);
      const text = await callOpenAI(openaiKey, prompt);
      const parsed = parseAIResponse(text);
      return { ...parsed, provider_mode: 'openai' };
    } catch (err) {
      console.error('OpenAI call failed:', err.message);
    }
  }

  // Fall back to demo
  return getDemoAnalysis(incident);
}

// ── Chat assistant ────────────────────────────────────────────────────────────

const CHAT_RULES = {
  'attack': (inc) => `Based on the incident type "${inc.incident_type}" and severity "${inc.severity}", this appears to be a ${inc.incident_type} attack. ${inc.description ? 'The description indicates: ' + inc.description.substring(0, 200) + '...' : ''}`,
  'investigate': (inc) => `For a ${inc.incident_type} incident at ${inc.severity} severity, start by: 1) Reviewing system and authentication logs around the incident time, 2) Identifying all affected assets and users, 3) Determining the attack vector, 4) Checking for lateral movement or persistence mechanisms.`,
  'risk': (inc) => `This incident has a risk score of ${inc.risk_score}/100. Contributing factors: severity (${inc.severity}), asset importance (${inc.asset_importance}), potential impact (${inc.potential_impact}), and threat confidence (${inc.threat_confidence}).`,
  'evidence': (inc) => {
    const ev = DEMO_DATA[inc.incident_type]?.evidence_to_collect || DEMO_DATA['Other'].evidence_to_collect;
    return 'Recommended evidence to collect: ' + ev.join('; ');
  },
  'response': (inc) => {
    const rec = DEMO_DATA[inc.incident_type]?.recommendations || DEMO_DATA['Other'].recommendations;
    return 'Recommended response actions: ' + rec.join('; ');
  },
  'report': (inc) => `For the incident report, include: incident summary, affected assets/users (${inc.affected_asset}, ${inc.affected_user}), timeline of events, investigation notes, evidence collected, response actions taken, and resolution summary.`,
};

async function runAIChat(incident, question, notes) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const notesText = notes.length > 0
    ? notes.map(n => n.note).join('\n')
    : 'No notes.';

  if (geminiKey || openaiKey) {
    const prompt = `You are a cybersecurity analyst assistant helping with incident ${incident.incident_code}.

Incident context:
- Title: ${incident.title}
- Type: ${incident.incident_type}
- Severity: ${incident.severity}
- Affected Asset: ${incident.affected_asset || 'Unknown'}
- Description: ${incident.description}
- Investigation Notes: ${notesText}

Analyst question: ${question}

Provide a concise, practical answer (2-5 sentences). Base your answer on the incident details provided. If the information is insufficient to answer, say so and explain what additional information is needed.`;

    try {
      const text = geminiKey
        ? await callGemini(geminiKey, prompt)
        : await callOpenAI(openaiKey, prompt);
      return { answer: text, mode: geminiKey ? 'gemini' : 'openai' };
    } catch (err) {
      console.error('AI chat failed:', err.message);
    }
  }

  // Demo fallback
  const q = question.toLowerCase();
  let answer = 'I can help you analyse this incident. ';

  if (q.includes('attack') || q.includes('type')) {
    answer += CHAT_RULES['attack'](incident);
  } else if (q.includes('invest') || q.includes('first') || q.includes('start')) {
    answer += CHAT_RULES['investigate'](incident);
  } else if (q.includes('risk') || q.includes('score') || q.includes('high') || q.includes('serious')) {
    answer += CHAT_RULES['risk'](incident);
  } else if (q.includes('evidence') || q.includes('collect') || q.includes('gather')) {
    answer += CHAT_RULES['evidence'](incident);
  } else if (q.includes('response') || q.includes('action') || q.includes('do')) {
    answer += CHAT_RULES['response'](incident);
  } else if (q.includes('report') || q.includes('document')) {
    answer += CHAT_RULES['report'](incident);
  } else {
    const rec = DEMO_DATA[incident.incident_type]?.recommendations || DEMO_DATA['Other'].recommendations;
    answer += `For a ${incident.incident_type} incident, focus on: ${rec.slice(0, 3).join('; ')}. `;
    answer += 'Please provide a more specific question for targeted guidance.';
  }

  return { answer, mode: 'demo' };
}

module.exports = { runAIAnalysis, runAIChat };
