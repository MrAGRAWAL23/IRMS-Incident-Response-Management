require('dotenv').config();
const bcrypt = require('bcryptjs');
const { initializeSchema, getDb } = require('./schema');

async function seed() {
  initializeSchema();
  const db = getDb();

  console.log('Seeding database...');

  // --- Users ---
  const demoPassword = 'Demo@1234';
  const hash = bcrypt.hashSync(demoPassword, 10);

  const users = [
    { name: 'Admin User',    email: 'admin@irms.com',   role: 'admin',   hash },
    { name: 'Analyst One',   email: 'analyst@irms.com', role: 'analyst', hash },
    { name: 'Viewer User',   email: 'viewer@irms.com',  role: 'viewer',  hash },
    { name: 'Analyst Two',   email: 'analyst2@irms.com',role: 'analyst', hash },
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (name, email, password_hash, role, is_active)
    VALUES (@name, @email, @hash, @role, 1)
  `);
  for (const u of users) insertUser.run(u);
  console.log('Users seeded.');

  // Fetch user IDs
  const adminUser    = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@irms.com');
  const analystUser  = db.prepare('SELECT id FROM users WHERE email = ?').get('analyst@irms.com');
  const analyst2User = db.prepare('SELECT id FROM users WHERE email = ?').get('analyst2@irms.com');

  if (!adminUser || !analystUser) {
    console.error('Could not find seeded users, aborting.');
    return;
  }

  // --- Incidents ---
  const existingCount = db.prepare('SELECT COUNT(*) as c FROM incidents').get().c;
  if (existingCount > 0) {
    console.log(`Incidents already seeded (${existingCount} found). Skipping incident seed.`);
    return;
  }

  function calcRiskScore(severity, assetImportance, potentialImpact, threatConfidence) {
    const sevMap = { Low: 5, Medium: 12, High: 20, Critical: 25 };
    const aiMap  = { Low: 5, Medium: 12, High: 20, Critical: 25 };
    const piMap  = { Low: 5, Medium: 12, High: 20, Critical: 25 };
    const tcMap  = { Low: 8, Medium: 17, High: 25 };
    const score = (sevMap[severity]||0) + (aiMap[assetImportance]||0) + (piMap[potentialImpact]||0) + (tcMap[threatConfidence]||0);
    return Math.min(100, Math.max(0, score));
  }

  function generateCode(db, year, seq) {
    return `INC-${year}-${String(seq).padStart(4,'0')}`;
  }

  const year = 2026;
  const seedIncidents = [
    {
      title: 'Suspicious Phishing Email Detected',
      description: 'Multiple employees received a phishing email impersonating the IT department requesting credential updates. The email contained a malicious link to a fake login page hosted at phish-corp.net.',
      incident_type: 'Phishing',
      severity: 'High',
      status: 'Investigating',
      source: 'Email Gateway Alert',
      affected_asset: 'Email System / Employee Workstations',
      affected_user: 'john.doe@corp.com',
      asset_importance: 'High',
      potential_impact: 'High',
      threat_confidence: 'High',
      assigned_analyst_id: analystUser.id,
      created_by: adminUser.id,
      created_at: '2026-10-01 08:15:00',
      updated_at: '2026-10-01 09:00:00',
    },
    {
      title: 'Multiple Failed Login Attempts',
      description: 'The account administrator@corp.com experienced 37 failed login attempts within a 10-minute window followed by a successful login from IP 185.234.219.44, a location not previously associated with this account.',
      incident_type: 'Brute Force',
      severity: 'High',
      status: 'Investigating',
      source: 'SIEM Alert',
      affected_asset: 'Active Directory',
      affected_user: 'administrator@corp.com',
      asset_importance: 'Critical',
      potential_impact: 'High',
      threat_confidence: 'High',
      assigned_analyst_id: analystUser.id,
      created_by: analystUser.id,
      created_at: '2026-10-02 10:30:00',
      updated_at: '2026-10-02 11:00:00',
    },
    {
      title: 'Malware Detected on Workstation WS-042',
      description: 'Endpoint protection detected a Trojan dropper (SHA256: a3f8d2c1b4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1) on workstation WS-042 assigned to user sarah.jones. The malware attempted to contact C2 server at 192.168.90.10.',
      incident_type: 'Malware',
      severity: 'Critical',
      status: 'Contained',
      source: 'Endpoint Protection',
      affected_asset: 'Workstation WS-042',
      affected_user: 'sarah.jones@corp.com',
      asset_importance: 'Medium',
      potential_impact: 'Critical',
      threat_confidence: 'High',
      assigned_analyst_id: analyst2User.id,
      created_by: adminUser.id,
      created_at: '2026-10-03 07:45:00',
      updated_at: '2026-10-03 09:30:00',
    },
    {
      title: 'Suspicious Login from Unknown Location',
      description: 'User michael.chen logged in from IP 203.0.113.55 (Geolocation: Moscow, Russia) at 03:42 AM local time. This is outside the user\'s normal working hours and geographical pattern.',
      incident_type: 'Suspicious Login',
      severity: 'Medium',
      status: 'Resolved',
      source: 'Identity Provider Alert',
      affected_asset: 'Corporate SSO',
      affected_user: 'michael.chen@corp.com',
      asset_importance: 'Medium',
      potential_impact: 'Medium',
      threat_confidence: 'Medium',
      assigned_analyst_id: analystUser.id,
      created_by: analystUser.id,
      resolution_summary: 'Confirmed with the user that they were traveling internationally. Login verified as legitimate. No unauthorized activity detected. Added travel notification policy reminder.',
      created_at: '2026-10-04 03:45:00',
      updated_at: '2026-10-04 14:00:00',
      resolved_at: '2026-10-04 14:00:00',
    },
    {
      title: 'Unauthorized Access Attempt on Server SRV-DB-01',
      description: 'Multiple unauthorized SSH access attempts were detected on the primary database server SRV-DB-01 from external IP 198.51.100.23. The attempts used common username enumeration techniques.',
      incident_type: 'Unauthorized Access',
      severity: 'High',
      status: 'Contained',
      source: 'Firewall IDS',
      affected_asset: 'Database Server SRV-DB-01',
      affected_user: 'N/A',
      asset_importance: 'Critical',
      potential_impact: 'High',
      threat_confidence: 'High',
      assigned_analyst_id: analyst2User.id,
      created_by: adminUser.id,
      created_at: '2026-10-05 14:20:00',
      updated_at: '2026-10-05 15:45:00',
    },
    {
      title: 'Possible Data Exfiltration via Cloud Storage',
      description: 'DLP system flagged an unusual upload of 2.3 GB of data to an unapproved personal cloud storage account (dropbox-personal.com) from workstation WS-087. The files included documents tagged as confidential.',
      incident_type: 'Data Breach',
      severity: 'Critical',
      status: 'Investigating',
      source: 'DLP Alert',
      affected_asset: 'Confidential Document Store',
      affected_user: 'robert.miller@corp.com',
      asset_importance: 'Critical',
      potential_impact: 'Critical',
      threat_confidence: 'High',
      assigned_analyst_id: analystUser.id,
      created_by: adminUser.id,
      created_at: '2026-10-06 09:00:00',
      updated_at: '2026-10-06 10:30:00',
    },
    {
      title: 'Suspicious Domain Reported by Employee',
      description: 'An employee reported receiving a text message linking to corp-helpdesk-secure.net, which mimics the corporate helpdesk domain. DNS records indicate the domain was registered 3 days ago.',
      incident_type: 'Phishing',
      severity: 'Medium',
      status: 'New',
      source: 'Employee Report',
      affected_asset: 'N/A',
      affected_user: 'N/A',
      asset_importance: 'Low',
      potential_impact: 'Medium',
      threat_confidence: 'Medium',
      assigned_analyst_id: analystUser.id,
      created_by: analystUser.id,
      created_at: '2026-10-07 11:00:00',
      updated_at: '2026-10-07 11:00:00',
    },
    {
      title: 'Unauthorized Software Installation Detected',
      description: 'Software inventory scan detected the installation of an unapproved remote access tool (AnyDesk) on workstation WS-023. The installation occurred outside business hours.',
      incident_type: 'Unauthorized Access',
      severity: 'Low',
      status: 'Resolved',
      source: 'IT Asset Management',
      affected_asset: 'Workstation WS-023',
      affected_user: 'emma.wilson@corp.com',
      asset_importance: 'Low',
      potential_impact: 'Low',
      threat_confidence: 'Medium',
      assigned_analyst_id: analyst2User.id,
      created_by: analystUser.id,
      resolution_summary: 'Software was removed and user was reminded of the acceptable use policy. No evidence of misuse found.',
      created_at: '2026-10-07 16:00:00',
      updated_at: '2026-10-08 09:00:00',
      resolved_at: '2026-10-08 09:00:00',
    },
    {
      title: 'Repeated Authentication Failures on VPN Gateway',
      description: 'The VPN gateway logged 215 failed authentication attempts across 12 different accounts over a 30-minute period originating from IP range 45.142.212.0/24.',
      incident_type: 'Brute Force',
      severity: 'Medium',
      status: 'Closed',
      source: 'VPN Gateway Logs',
      affected_asset: 'VPN Gateway',
      affected_user: 'Multiple accounts',
      asset_importance: 'High',
      potential_impact: 'High',
      threat_confidence: 'High',
      assigned_analyst_id: analystUser.id,
      created_by: analystUser.id,
      resolution_summary: 'IP range was blocked at the perimeter firewall. No successful authentications from the blocked range. MFA enforcement policy updated for all VPN users.',
      created_at: '2026-10-08 06:30:00',
      updated_at: '2026-10-08 11:00:00',
      resolved_at: '2026-10-08 10:00:00',
      closed_at: '2026-10-08 11:00:00',
    },
    {
      title: 'Suspicious File Hash Identified in Email Attachment',
      description: 'Email security gateway quarantined an attachment (invoice_oct_2026.pdf.exe) with a known malicious hash (MD5: 5d41402abc4b2a76b9719d911017c592) associated with a banking trojan family.',
      incident_type: 'Malware',
      severity: 'High',
      status: 'Resolved',
      source: 'Email Security Gateway',
      affected_asset: 'Email Gateway',
      affected_user: 'finance@corp.com',
      asset_importance: 'High',
      potential_impact: 'High',
      threat_confidence: 'High',
      assigned_analyst_id: analyst2User.id,
      created_by: adminUser.id,
      resolution_summary: 'Attachment quarantined successfully. No user opened the attachment. Hash blocklisted across all endpoints. Sender domain added to email blocklist.',
      created_at: '2026-10-09 13:15:00',
      updated_at: '2026-10-09 15:00:00',
      resolved_at: '2026-10-09 15:00:00',
    },
    {
      title: 'Ransomware Alert on File Server FS-01',
      description: 'File integrity monitoring detected mass file rename operations with .locked extension on shared file server FS-01. Multiple users reported inability to access their documents.',
      incident_type: 'Ransomware',
      severity: 'Critical',
      status: 'Investigating',
      source: 'File Integrity Monitor',
      affected_asset: 'File Server FS-01',
      affected_user: 'Multiple users',
      asset_importance: 'Critical',
      potential_impact: 'Critical',
      threat_confidence: 'High',
      assigned_analyst_id: analystUser.id,
      created_by: adminUser.id,
      created_at: '2026-10-10 08:00:00',
      updated_at: '2026-10-10 09:00:00',
    },
    {
      title: 'False Positive: Automated Security Scan Flagged as Attack',
      description: 'IDS flagged internal vulnerability scanner activity as a port scan attack. Source IP was traced to the authorized Nessus scanner on IP 10.0.0.5 running a scheduled scan.',
      incident_type: 'Other',
      severity: 'Low',
      status: 'False Positive',
      source: 'IDS',
      affected_asset: 'Network Infrastructure',
      affected_user: 'N/A',
      asset_importance: 'Low',
      potential_impact: 'Low',
      threat_confidence: 'Low',
      assigned_analyst_id: analyst2User.id,
      created_by: analystUser.id,
      resolution_summary: 'Confirmed as authorized vulnerability scanning activity. IDS rule updated to whitelist the scanner IP range.',
      created_at: '2026-10-10 14:00:00',
      updated_at: '2026-10-10 14:30:00',
      resolved_at: '2026-10-10 14:30:00',
      closed_at: '2026-10-10 14:30:00',
    },
  ];

  const insertIncident = db.prepare(`
    INSERT INTO incidents (
      incident_code, title, description, incident_type, severity, status, source,
      affected_asset, affected_user, asset_importance, potential_impact, threat_confidence,
      risk_score, assigned_analyst_id, created_by, resolution_summary,
      created_at, updated_at, resolved_at, closed_at
    ) VALUES (
      @incident_code, @title, @description, @incident_type, @severity, @status, @source,
      @affected_asset, @affected_user, @asset_importance, @potential_impact, @threat_confidence,
      @risk_score, @assigned_analyst_id, @created_by, @resolution_summary,
      @created_at, @updated_at, @resolved_at, @closed_at
    )
  `);

  const insertTimeline = db.prepare(`
    INSERT INTO timeline_events (incident_id, actor_id, event_type, description, created_at)
    VALUES (@incident_id, @actor_id, @event_type, @description, @created_at)
  `);

  const insertNote = db.prepare(`
    INSERT INTO investigation_notes (incident_id, author_id, note, created_at)
    VALUES (@incident_id, @author_id, @note, @created_at)
  `);

  const insertEvidence = db.prepare(`
    INSERT INTO evidence (incident_id, name, evidence_type, description, reference, added_by, created_at)
    VALUES (@incident_id, @name, @evidence_type, @description, @reference, @added_by, @created_at)
  `);

  const insertAction = db.prepare(`
    INSERT INTO response_actions (incident_id, action_type, description, result, status, performed_by, created_at)
    VALUES (@incident_id, @action_type, @description, @result, @status, @performed_by, @created_at)
  `);

  const updateSeq = db.prepare(`
    INSERT INTO incident_sequence (year, last_seq) VALUES (@year, @seq)
    ON CONFLICT(year) DO UPDATE SET last_seq = @seq
  `);

  const seedAll = db.transaction(() => {
    for (let i = 0; i < seedIncidents.length; i++) {
      const inc = seedIncidents[i];
      const seq = i + 1;
      const incident_code = generateCode(db, year, seq);
      const risk_score = calcRiskScore(inc.severity, inc.asset_importance, inc.potential_impact, inc.threat_confidence);

      const result = insertIncident.run({
        ...inc,
        incident_code,
        risk_score,
        resolution_summary: inc.resolution_summary || null,
        resolved_at: inc.resolved_at || null,
        closed_at: inc.closed_at || null,
      });

      const incId = result.lastInsertRowid;

      // Timeline: created
      insertTimeline.run({
        incident_id: incId,
        actor_id: inc.created_by,
        event_type: 'incident_created',
        description: `Incident ${incident_code} created: ${inc.title}`,
        created_at: inc.created_at,
      });

      // Timeline: assigned
      if (inc.assigned_analyst_id) {
        const analystName = db.prepare('SELECT name FROM users WHERE id = ?').get(inc.assigned_analyst_id)?.name || 'Unknown';
        insertTimeline.run({
          incident_id: incId,
          actor_id: adminUser.id,
          event_type: 'incident_assigned',
          description: `Incident assigned to ${analystName}`,
          created_at: inc.created_at,
        });
      }

      // Add notes for some incidents
      if (i === 0) {
        insertNote.run({ incident_id: incId, author_id: analystUser.id, note: 'Initial triage complete. The phishing link has been identified and submitted for sandboxing. Affected employees have been notified to not click the link.', created_at: '2026-10-01 09:00:00' });
        insertTimeline.run({ incident_id: incId, actor_id: analystUser.id, event_type: 'note_added', description: 'Investigation note added', created_at: '2026-10-01 09:00:00' });
        insertEvidence.run({ incident_id: incId, name: 'Phishing Email Headers', evidence_type: 'Log', description: 'Raw email headers showing spoofed sender domain', reference: 'email_headers_INC-2026-0001.txt', added_by: analystUser.id, created_at: '2026-10-01 09:05:00' });
        insertTimeline.run({ incident_id: incId, actor_id: analystUser.id, event_type: 'evidence_added', description: 'Evidence added: Phishing Email Headers', created_at: '2026-10-01 09:05:00' });
        insertEvidence.run({ incident_id: incId, name: 'Malicious URL Screenshot', evidence_type: 'Screenshot', description: 'Screenshot of the fake login page at phish-corp.net', reference: 'screenshot_phish_page.png', added_by: analystUser.id, created_at: '2026-10-01 09:10:00' });
      }

      if (i === 1) {
        insertNote.run({ incident_id: incId, author_id: analystUser.id, note: 'Authentication logs pulled. The 37 failed attempts used common password variations. Successful login occurred 2 minutes after the last failure, suggesting the attacker had the correct credentials. Account temporarily locked pending investigation.', created_at: '2026-10-02 11:00:00' });
        insertTimeline.run({ incident_id: incId, actor_id: analystUser.id, event_type: 'note_added', description: 'Investigation note added', created_at: '2026-10-02 11:00:00' });
        insertEvidence.run({ incident_id: incId, name: 'Authentication Log Extract', evidence_type: 'Log', description: 'Failed login attempts log from Active Directory', reference: 'auth_log_INC-2026-0002.csv', added_by: analystUser.id, created_at: '2026-10-02 11:15:00' });
        insertEvidence.run({ incident_id: incId, name: 'Source IP 185.234.219.44', evidence_type: 'IP Address', description: 'IP address of the successful login - traced to a VPN exit node in Eastern Europe', reference: '185.234.219.44', added_by: analystUser.id, created_at: '2026-10-02 11:20:00' });
        insertAction.run({ incident_id: incId, action_type: 'Disable Account', description: 'Temporarily disabled the administrator@corp.com account to prevent further unauthorized access pending investigation.', result: 'Account disabled successfully in Active Directory.', status: 'Completed', performed_by: analystUser.id, created_at: '2026-10-02 11:30:00' });
        insertTimeline.run({ incident_id: incId, actor_id: analystUser.id, event_type: 'action_recorded', description: 'Response action recorded: Disable Account', created_at: '2026-10-02 11:30:00' });
        insertAction.run({ incident_id: incId, action_type: 'Block IP', description: 'Blocked IP 185.234.219.44 at perimeter firewall to prevent further connection attempts.', result: 'IP blocked at firewall layer 3.', status: 'Completed', performed_by: analystUser.id, created_at: '2026-10-02 11:35:00' });
        insertTimeline.run({ incident_id: incId, actor_id: analystUser.id, event_type: 'action_recorded', description: 'Response action recorded: Block IP', created_at: '2026-10-02 11:35:00' });
      }

      if (i === 2) {
        insertNote.run({ incident_id: incId, author_id: analyst2User.id, note: 'Workstation WS-042 has been isolated from the network. Malware sample collected for analysis. The dropper appears to be attempting to download a secondary payload from 192.168.90.10 - this IP has been blocked.', created_at: '2026-10-03 08:00:00' });
        insertTimeline.run({ incident_id: incId, actor_id: analyst2User.id, event_type: 'note_added', description: 'Investigation note added', created_at: '2026-10-03 08:00:00' });
        insertEvidence.run({ incident_id: incId, name: 'Malware File Hash', evidence_type: 'File Hash', description: 'SHA256 of the Trojan dropper: a3f8d2c1b4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1', reference: 'a3f8d2c1b4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1', added_by: analyst2User.id, created_at: '2026-10-03 08:30:00' });
        insertEvidence.run({ incident_id: incId, name: 'C2 Server IP', evidence_type: 'IP Address', description: 'Command and control server IP address: 192.168.90.10', reference: '192.168.90.10', added_by: analyst2User.id, created_at: '2026-10-03 08:35:00' });
        insertAction.run({ incident_id: incId, action_type: 'Isolate Device', description: 'Isolated workstation WS-042 from the network to prevent malware spread and C2 communication.', result: 'Network isolation confirmed. Device offline.', status: 'Completed', performed_by: analyst2User.id, created_at: '2026-10-03 08:15:00' });
        insertTimeline.run({ incident_id: incId, actor_id: analyst2User.id, event_type: 'action_recorded', description: 'Response action recorded: Isolate Device', created_at: '2026-10-03 08:15:00' });
        insertAction.run({ incident_id: incId, action_type: 'Block IP', description: 'Blocked C2 server IP 192.168.90.10 at perimeter firewall.', result: 'C2 IP blocked. No further outbound connections observed.', status: 'Completed', performed_by: analyst2User.id, created_at: '2026-10-03 08:20:00' });
        insertTimeline.run({ incident_id: incId, actor_id: analyst2User.id, event_type: 'action_recorded', description: 'Response action recorded: Block IP', created_at: '2026-10-03 08:20:00' });
        insertTimeline.run({ incident_id: incId, actor_id: analyst2User.id, event_type: 'status_changed', description: 'Status changed to Contained', created_at: '2026-10-03 09:30:00' });
      }

      if (i === 5) {
        insertNote.run({ incident_id: incId, author_id: analystUser.id, note: 'DLP alert reviewed. Large data transfer confirmed. Files included Q3 financial reports and HR records. User robert.miller account has been temporarily suspended pending investigation. Legal team notified.', created_at: '2026-10-06 10:00:00' });
        insertTimeline.run({ incident_id: incId, actor_id: analystUser.id, event_type: 'note_added', description: 'Investigation note added', created_at: '2026-10-06 10:00:00' });
        insertEvidence.run({ incident_id: incId, name: 'DLP Alert Log', evidence_type: 'Log', description: 'DLP system log showing 2.3GB upload to external cloud storage', reference: 'dlp_alert_INC-2026-0006.log', added_by: analystUser.id, created_at: '2026-10-06 10:15:00' });
        insertEvidence.run({ incident_id: incId, name: 'Suspicious Domain', evidence_type: 'Domain', description: 'Destination domain: dropbox-personal.com', reference: 'dropbox-personal.com', added_by: analystUser.id, created_at: '2026-10-06 10:20:00' });
        insertAction.run({ incident_id: incId, action_type: 'Disable Account', description: 'Suspended robert.miller account access pending investigation outcome.', result: 'Account suspended in Active Directory and SSO.', status: 'Completed', performed_by: analystUser.id, created_at: '2026-10-06 10:30:00' });
        insertTimeline.run({ incident_id: incId, actor_id: analystUser.id, event_type: 'action_recorded', description: 'Response action recorded: Disable Account', created_at: '2026-10-06 10:30:00' });
        insertAction.run({ incident_id: incId, action_type: 'Block Domain', description: 'Blocked dropbox-personal.com at web proxy to prevent further data exfiltration.', result: 'Domain blocked at proxy layer.', status: 'Completed', performed_by: analystUser.id, created_at: '2026-10-06 10:35:00' });
        insertTimeline.run({ incident_id: incId, actor_id: analystUser.id, event_type: 'action_recorded', description: 'Response action recorded: Block Domain', created_at: '2026-10-06 10:35:00' });
      }

      // Timeline for resolved/closed
      if (inc.resolved_at) {
        insertTimeline.run({ incident_id: incId, actor_id: inc.assigned_analyst_id || adminUser.id, event_type: 'status_changed', description: 'Status changed to Resolved', created_at: inc.resolved_at });
      }
      if (inc.closed_at) {
        insertTimeline.run({ incident_id: incId, actor_id: inc.assigned_analyst_id || adminUser.id, event_type: 'status_changed', description: 'Status changed to Closed', created_at: inc.closed_at });
      }

      updateSeq.run({ year, seq });
    }
  });

  seedAll();
  console.log(`Seeded ${seedIncidents.length} incidents.`);
  console.log('Database seeding complete.');
  console.log('\nDemo accounts:');
  console.log('  Admin:    admin@irms.com    / Demo@1234');
  console.log('  Analyst:  analyst@irms.com  / Demo@1234');
  console.log('  Analyst2: analyst2@irms.com / Demo@1234');
  console.log('  Viewer:   viewer@irms.com   / Demo@1234');
}

seed().catch(console.error);
