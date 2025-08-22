// config/arcjet.js
const arcjet = require('@arcjet/node').default ?? require('@arcjet/node');
const { shield, detectBot, tokenBucket } = require('@arcjet/node');
const mode = process.env.NODE_ENV === 'development' ? '.env.development.local' : '.env.production.local'
require('dotenv').config({ path: mode });

// Initialize Arcjet using the default function export
const aj = arcjet({
  key: process.env.ARCJET_API_KEY,
  characteristics: ['ip.src'],
  rules: [
    shield({ mode: 'LIVE' }),
    detectBot({
      mode: 'LIVE',
      allow: ['CATEGORY:SEARCH_ENGINE'],
    }),
    tokenBucket({
      mode: 'LIVE',
      refillRate: 5,
      interval: 10,
      capacity: 10,
    }),
  ],
});

module.exports = aj;