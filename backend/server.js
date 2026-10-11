const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`IRMS Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    console.log('AI Mode: Demo (no API key configured)');
  } else {
    console.log('AI Mode: Live');
  }
});
