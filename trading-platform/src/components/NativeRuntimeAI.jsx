import React, {useEffect,useState} from 'react';
import NativeAIControls from './NativeAIControls';
import NativeAIReport from './NativeAIReport';
import useNativeAIRequest from './useNativeAIRequest';
import './NativeRuntimeAI.css';

function presetFields(config,index){
  return Object.fromEntries(config.fields.map(field=>[field.key,field.examples[index]]));
}

export default function NativeRuntimeAI({config,request}) {
  const [fields,setFields]=useState({}),[result,setResult]=useState(null),[error,setError]=useState('');
  const [history,setHistory]=useState([]),[historyError,setHistoryError]=useState('');
  const native=useNativeAIRequest();
  useEffect(()=>{
    let active=true;
    request('/api/runtime-ai/history').then(data=>{if(active){if(!Array.isArray(data?.results))throw new TypeError('Saved reports response is invalid.');setHistory(data.results);setHistoryError('');}}).catch(()=>{if(active)setHistoryError('Saved reports could not be loaded.');});
    return ()=>{active=false;};
  },[request]);
  const presets=[0,1,2].map(index=>({name:['Quick brief','Team planning','Detailed review'][index],fill:()=>{setFields(presetFields(config,index));return {filled:config.fields.length,manual:[]};}}));
  async function generate(event){event.preventDefault();setError('');setResult(null);try{const body=Object.fromEntries(config.fields.map(field=>[field.key,fields[field.key]||'']));const response=await native.run(signal=>request(config.endpoint,body,{signal}));setResult(response);setHistory(current=>[{id:response.id,output:response.response,model:response.model,created_at:new Date().toISOString()},...current].slice(0,20));}catch(failure){setError(failure.name==='AbortError'?'Request canceled.':failure.response?.data?.error||failure.message);}}
  return <section className="native-runtime-ai" id="ai-readiness"><header><p className="ai-eyebrow">Native AI workspace</p><h1>{config.title}</h1><p>{config.description}</p></header><NativeAIControls busy={native.busy} onCancel={native.cancel} presets={presets} context={config.title}><form onSubmit={generate}><div className="native-runtime-fields">{config.fields.map(field=><label key={field.key} htmlFor={'native-runtime-'+field.key}>{field.label}{field.required?' *':' (optional)'}<textarea id={'native-runtime-'+field.key} data-ai-field={field.key} rows={5} required={field.required} maxLength={field.maxLength||4000} value={fields[field.key]||''} onChange={event=>setFields({...fields,[field.key]:event.target.value})}/></label>)}</div><button type="submit" className="native-runtime-generate" disabled={native.busy}>{native.busy?'Generating…':'Generate with OpenRouter'}</button>{error&&<p role="alert">{error}</p>}</form></NativeAIControls>{result&&<NativeAIReport response={result} title={config.title}/>}<section className="ai-history"><h2>Saved reports</h2>{historyError&&<p role="alert">{historyError}</p>}{!historyError&&!history.length&&<p>No saved reports yet.</p>}{history.map(item=><details key={item.id}><summary className="ai-history-row">Report from {new Date(item.created_at).toLocaleString()}</summary><NativeAIReport response={{response:item.output,model:item.model}} title="Saved operational risk review" /></details>)}</section></section>;
}
