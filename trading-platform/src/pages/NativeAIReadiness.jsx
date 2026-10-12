import React from 'react';
import NativeRuntimeAI from '../components/NativeRuntimeAI';
import api from '../services/api';
import {useAuth} from '../contexts/AuthContext';
const request=(endpoint,body,options)=>body===undefined?api.get(endpoint).then(r=>r.data):api.post(endpoint,body,options).then(r=>r.data);
const config={
  "title": "Cryptocurrency operational risk review",
  "description": "Native OpenRouter advisory review of supplied information. Examples are illustrative; existing records, evidence, approvals, permissions and operational controls remain authoritative. This response performs no external action.",
  "endpoint": "/api/runtime-ai/analysis",
  "fields": [
    {
      "key": "prompt",
      "label": "Review brief",
      "required": true,
      "maxLength": 4000,
      "examples": [
        "Illustrative Cryptocurrency operational risk review brief: review supplied source information, identify evidence gaps, and suggest three next steps for an authorized reviewer. No external action is authorized.",
        "Illustrative Cryptocurrency operational risk review team review: compare options, dependencies, responsible reviewers, and timing. Explain missing evidence and approvals before any operational change.",
        "Illustrative Cryptocurrency operational risk review detailed review: distinguish verified facts from assumptions, compare tradeoffs, and suggest measurable follow-up actions. Do not invent records, integrations, approvals, clinical findings or financial execution."
      ]
    },
    {
      "key": "context",
      "label": "Known constraints and source context",
      "required": false,
      "maxLength": 4000,
      "examples": [
        "Illustrative review only. No verified exchange, custody, or market feed is supplied. Flag any missing evidence before recommending action.",
        "The operations team needs an internal review plan. Existing risk limits and approvals remain authoritative; identify who should verify data provenance and sign off.",
        "Assess operational exposure under stale prices, interrupted exchange connectivity, and uncertain custody balances. Treat these as scenarios, not observed incidents."
      ]
    }
  ]
};
export default function NativeAIReadiness(){const {user,loading}=useAuth();if(loading)return <p>Verifying session…</p>;if(!user)return <p>Sign in through the application to access AI review.</p>;return <NativeRuntimeAI config={config} request={request}/>;}
