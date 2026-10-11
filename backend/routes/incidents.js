const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/incidentController');
const ai = require('../controllers/aiController');

router.get('/', authenticate, c.listIncidents);
router.post('/', authenticate, c.createIncident);
router.get('/:id', authenticate, c.getIncident);
router.put('/:id', authenticate, c.updateIncident);
router.delete('/:id', authenticate, c.deleteIncident);
router.patch('/:id/status', authenticate, c.updateStatus);

router.get('/:id/notes', authenticate, c.getNotes);
router.post('/:id/notes', authenticate, c.addNote);

router.get('/:id/evidence', authenticate, c.getEvidence);
router.post('/:id/evidence', authenticate, c.addEvidence);

router.get('/:id/actions', authenticate, c.getActions);
router.post('/:id/actions', authenticate, c.addAction);

router.get('/:id/timeline', authenticate, c.getTimeline);

router.get('/:id/ai-analysis', authenticate, ai.getAnalyses);
router.post('/:id/ai-analysis', authenticate, ai.analyzeIncident);
router.post('/:id/ai-chat', authenticate, ai.chatWithAI);

module.exports = router;
