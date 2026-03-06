"use strict";(()=>{var e={};e.id=233,e.ids=[233],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},3554:(e,t,n)=>{n.r(t),n.d(t,{originalPathname:()=>el,patchFetch:()=>ec,requestAsyncStorage:()=>ei,routeModule:()=>eo,serverHooks:()=>er,staticGenerationAsyncStorage:()=>ea});var s,o,i,a,r,l,c,d,u,h,f,p,m={};n.r(m),n.d(m,{POST:()=>es});var g=n(9303),E=n(8716),y=n(670),C=n(7070);(function(e){e.STRING="string",e.NUMBER="number",e.INTEGER="integer",e.BOOLEAN="boolean",e.ARRAY="array",e.OBJECT="object"})(s||(s={})),function(e){e.LANGUAGE_UNSPECIFIED="language_unspecified",e.PYTHON="python"}(o||(o={})),function(e){e.OUTCOME_UNSPECIFIED="outcome_unspecified",e.OUTCOME_OK="outcome_ok",e.OUTCOME_FAILED="outcome_failed",e.OUTCOME_DEADLINE_EXCEEDED="outcome_deadline_exceeded"}(i||(i={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let O=["user","model","function","system"];(function(e){e.HARM_CATEGORY_UNSPECIFIED="HARM_CATEGORY_UNSPECIFIED",e.HARM_CATEGORY_HATE_SPEECH="HARM_CATEGORY_HATE_SPEECH",e.HARM_CATEGORY_SEXUALLY_EXPLICIT="HARM_CATEGORY_SEXUALLY_EXPLICIT",e.HARM_CATEGORY_HARASSMENT="HARM_CATEGORY_HARASSMENT",e.HARM_CATEGORY_DANGEROUS_CONTENT="HARM_CATEGORY_DANGEROUS_CONTENT"})(a||(a={})),function(e){e.HARM_BLOCK_THRESHOLD_UNSPECIFIED="HARM_BLOCK_THRESHOLD_UNSPECIFIED",e.BLOCK_LOW_AND_ABOVE="BLOCK_LOW_AND_ABOVE",e.BLOCK_MEDIUM_AND_ABOVE="BLOCK_MEDIUM_AND_ABOVE",e.BLOCK_ONLY_HIGH="BLOCK_ONLY_HIGH",e.BLOCK_NONE="BLOCK_NONE"}(r||(r={})),function(e){e.HARM_PROBABILITY_UNSPECIFIED="HARM_PROBABILITY_UNSPECIFIED",e.NEGLIGIBLE="NEGLIGIBLE",e.LOW="LOW",e.MEDIUM="MEDIUM",e.HIGH="HIGH"}(l||(l={})),function(e){e.BLOCKED_REASON_UNSPECIFIED="BLOCKED_REASON_UNSPECIFIED",e.SAFETY="SAFETY",e.OTHER="OTHER"}(c||(c={})),function(e){e.FINISH_REASON_UNSPECIFIED="FINISH_REASON_UNSPECIFIED",e.STOP="STOP",e.MAX_TOKENS="MAX_TOKENS",e.SAFETY="SAFETY",e.RECITATION="RECITATION",e.LANGUAGE="LANGUAGE",e.OTHER="OTHER"}(d||(d={})),function(e){e.TASK_TYPE_UNSPECIFIED="TASK_TYPE_UNSPECIFIED",e.RETRIEVAL_QUERY="RETRIEVAL_QUERY",e.RETRIEVAL_DOCUMENT="RETRIEVAL_DOCUMENT",e.SEMANTIC_SIMILARITY="SEMANTIC_SIMILARITY",e.CLASSIFICATION="CLASSIFICATION",e.CLUSTERING="CLUSTERING"}(u||(u={})),function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.AUTO="AUTO",e.ANY="ANY",e.NONE="NONE"}(h||(h={})),function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.MODE_DYNAMIC="MODE_DYNAMIC"}(f||(f={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class I extends Error{constructor(e){super(`[GoogleGenerativeAI Error]: ${e}`)}}class _ extends I{constructor(e,t){super(e),this.response=t}}class v extends I{constructor(e,t,n,s){super(e),this.status=t,this.statusText=n,this.errorDetails=s}}class N extends I{}!function(e){e.GENERATE_CONTENT="generateContent",e.STREAM_GENERATE_CONTENT="streamGenerateContent",e.COUNT_TOKENS="countTokens",e.EMBED_CONTENT="embedContent",e.BATCH_EMBED_CONTENTS="batchEmbedContents"}(p||(p={}));class A{constructor(e,t,n,s,o){this.model=e,this.task=t,this.apiKey=n,this.stream=s,this.requestOptions=o}toString(){var e,t;let n=(null===(e=this.requestOptions)||void 0===e?void 0:e.apiVersion)||"v1beta",s=(null===(t=this.requestOptions)||void 0===t?void 0:t.baseUrl)||"https://generativelanguage.googleapis.com",o=`${s}/${n}/${this.model}:${this.task}`;return this.stream&&(o+="?alt=sse"),o}}async function S(e){var t;let n=new Headers;n.append("Content-Type","application/json"),n.append("x-goog-api-client",function(e){let t=[];return(null==e?void 0:e.apiClient)&&t.push(e.apiClient),t.push("genai-js/0.21.0"),t.join(" ")}(e.requestOptions)),n.append("x-goog-api-key",e.apiKey);let s=null===(t=e.requestOptions)||void 0===t?void 0:t.customHeaders;if(s){if(!(s instanceof Headers))try{s=new Headers(s)}catch(e){throw new N(`unable to convert customHeaders value ${JSON.stringify(s)} to Headers: ${e.message}`)}for(let[e,t]of s.entries()){if("x-goog-api-key"===e)throw new N(`Cannot set reserved header name ${e}`);if("x-goog-api-client"===e)throw new N(`Header name ${e} can only be set using the apiClient field`);n.append(e,t)}}return n}async function w(e,t,n,s,o,i){let a=new A(e,t,n,s,i);return{url:a.toString(),fetchOptions:Object.assign(Object.assign({},function(e){let t={};if((null==e?void 0:e.signal)!==void 0||(null==e?void 0:e.timeout)>=0){let n=new AbortController;(null==e?void 0:e.timeout)>=0&&setTimeout(()=>n.abort(),e.timeout),(null==e?void 0:e.signal)&&e.signal.addEventListener("abort",()=>{n.abort()}),t.signal=n.signal}return t}(i)),{method:"POST",headers:await S(a),body:o})}}async function R(e,t,n,s,o,i={},a=fetch){let{url:r,fetchOptions:l}=await w(e,t,n,s,o,i);return T(r,l,a)}async function T(e,t,n=fetch){let s;try{s=await n(e,t)}catch(t){(function(e,t){let n=e;throw e instanceof v||e instanceof N||((n=new I(`Error fetching from ${t.toString()}: ${e.message}`)).stack=e.stack),n})(t,e)}return s.ok||await b(s,e),s}async function b(e,t){let n,s="";try{let t=await e.json();s=t.error.message,t.error.details&&(s+=` ${JSON.stringify(t.error.details)}`,n=t.error.details)}catch(e){}throw new v(`Error fetching from ${t.toString()}: [${e.status} ${e.statusText}] ${s}`,e.status,e.statusText,n)}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function M(e){return e.text=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning text from the first candidate only. Access response.candidates directly to use the other candidates.`),j(e.candidates[0]))throw new _(`${P(e)}`,e);return function(e){var t,n,s,o;let i=[];if(null===(n=null===(t=e.candidates)||void 0===t?void 0:t[0].content)||void 0===n?void 0:n.parts)for(let t of null===(o=null===(s=e.candidates)||void 0===s?void 0:s[0].content)||void 0===o?void 0:o.parts)t.text&&i.push(t.text),t.executableCode&&i.push("\n```"+t.executableCode.language+"\n"+t.executableCode.code+"\n```\n"),t.codeExecutionResult&&i.push("\n```\n"+t.codeExecutionResult.output+"\n```\n");return i.length>0?i.join(""):""}(e)}if(e.promptFeedback)throw new _(`Text not available. ${P(e)}`,e);return""},e.functionCall=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),j(e.candidates[0]))throw new _(`${P(e)}`,e);return console.warn("response.functionCall() is deprecated. Use response.functionCalls() instead."),x(e)[0]}if(e.promptFeedback)throw new _(`Function call not available. ${P(e)}`,e)},e.functionCalls=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),j(e.candidates[0]))throw new _(`${P(e)}`,e);return x(e)}if(e.promptFeedback)throw new _(`Function call not available. ${P(e)}`,e)},e}function x(e){var t,n,s,o;let i=[];if(null===(n=null===(t=e.candidates)||void 0===t?void 0:t[0].content)||void 0===n?void 0:n.parts)for(let t of null===(o=null===(s=e.candidates)||void 0===s?void 0:s[0].content)||void 0===o?void 0:o.parts)t.functionCall&&i.push(t.functionCall);return i.length>0?i:void 0}let D=[d.RECITATION,d.SAFETY,d.LANGUAGE];function j(e){return!!e.finishReason&&D.includes(e.finishReason)}function P(e){var t,n,s;let o="";if((!e.candidates||0===e.candidates.length)&&e.promptFeedback)o+="Response was blocked",(null===(t=e.promptFeedback)||void 0===t?void 0:t.blockReason)&&(o+=` due to ${e.promptFeedback.blockReason}`),(null===(n=e.promptFeedback)||void 0===n?void 0:n.blockReasonMessage)&&(o+=`: ${e.promptFeedback.blockReasonMessage}`);else if(null===(s=e.candidates)||void 0===s?void 0:s[0]){let t=e.candidates[0];j(t)&&(o+=`Candidate was blocked due to ${t.finishReason}`,t.finishMessage&&(o+=`: ${t.finishMessage}`))}return o}function U(e){return this instanceof U?(this.v=e,this):new U(e)}"function"==typeof SuppressedError&&SuppressedError;/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let L=/^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;async function F(e){let t=[],n=e.getReader();for(;;){let{done:e,value:s}=await n.read();if(e)return M(function(e){let t=e[e.length-1],n={promptFeedback:null==t?void 0:t.promptFeedback};for(let t of e){if(t.candidates)for(let e of t.candidates){let t=e.index;if(n.candidates||(n.candidates=[]),n.candidates[t]||(n.candidates[t]={index:e.index}),n.candidates[t].citationMetadata=e.citationMetadata,n.candidates[t].groundingMetadata=e.groundingMetadata,n.candidates[t].finishReason=e.finishReason,n.candidates[t].finishMessage=e.finishMessage,n.candidates[t].safetyRatings=e.safetyRatings,e.content&&e.content.parts){n.candidates[t].content||(n.candidates[t].content={role:e.content.role||"user",parts:[]});let s={};for(let o of e.content.parts)o.text&&(s.text=o.text),o.functionCall&&(s.functionCall=o.functionCall),o.executableCode&&(s.executableCode=o.executableCode),o.codeExecutionResult&&(s.codeExecutionResult=o.codeExecutionResult),0===Object.keys(s).length&&(s.text=""),n.candidates[t].content.parts.push(s)}}t.usageMetadata&&(n.usageMetadata=t.usageMetadata)}return n}(t));t.push(s)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function G(e,t,n,s){return function(e){let[t,n]=(function(e){let t=e.getReader();return new ReadableStream({start(e){let n="";return function s(){return t.read().then(({value:t,done:o})=>{let i;if(o){if(n.trim()){e.error(new I("Failed to parse stream"));return}e.close();return}let a=(n+=t).match(L);for(;a;){try{i=JSON.parse(a[1])}catch(t){e.error(new I(`Error parsing JSON response: "${a[1]}"`));return}e.enqueue(i),a=(n=n.substring(a[0].length)).match(L)}return s()})}()}})})(e.body.pipeThrough(new TextDecoderStream("utf8",{fatal:!0}))).tee();return{stream:function(e){return function(e,t,n){if(!Symbol.asyncIterator)throw TypeError("Symbol.asyncIterator is not defined.");var s,o=n.apply(e,t||[]),i=[];return s={},a("next"),a("throw"),a("return"),s[Symbol.asyncIterator]=function(){return this},s;function a(e){o[e]&&(s[e]=function(t){return new Promise(function(n,s){i.push([e,t,n,s])>1||r(e,t)})})}function r(e,t){try{var n;(n=o[e](t)).value instanceof U?Promise.resolve(n.value.v).then(l,c):d(i[0][2],n)}catch(e){d(i[0][3],e)}}function l(e){r("next",e)}function c(e){r("throw",e)}function d(e,t){e(t),i.shift(),i.length&&r(i[0][0],i[0][1])}}(this,arguments,function*(){let t=e.getReader();for(;;){let{value:e,done:n}=yield U(t.read());if(n)break;yield yield U(M(e))}})}(t),response:F(n)}}(await R(t,p.STREAM_GENERATE_CONTENT,e,!0,JSON.stringify(n),s))}async function H(e,t,n,s){let o=await R(t,p.GENERATE_CONTENT,e,!1,JSON.stringify(n),s);return{response:M(await o.json())}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function k(e){if(null!=e){if("string"==typeof e)return{role:"system",parts:[{text:e}]};if(e.text)return{role:"system",parts:[e]};if(e.parts)return e.role?e:{role:"system",parts:e.parts}}}function Y(e){let t=[];if("string"==typeof e)t=[{text:e}];else for(let n of e)"string"==typeof n?t.push({text:n}):t.push(n);return function(e){let t={role:"user",parts:[]},n={role:"function",parts:[]},s=!1,o=!1;for(let i of e)"functionResponse"in i?(n.parts.push(i),o=!0):(t.parts.push(i),s=!0);if(s&&o)throw new I("Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.");if(!s&&!o)throw new I("No content is provided for sending chat message.");return s?t:n}(t)}function $(e){let t;return t=e.contents?e:{contents:[Y(e)]},e.systemInstruction&&(t.systemInstruction=k(e.systemInstruction)),t}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let B=["text","inlineData","functionCall","functionResponse","executableCode","codeExecutionResult"],K={user:["text","inlineData"],function:["functionResponse"],model:["text","functionCall","executableCode","codeExecutionResult"],system:["text"]},q="SILENT_ERROR";class J{constructor(e,t,n,s={}){this.model=t,this.params=n,this._requestOptions=s,this._history=[],this._sendPromise=Promise.resolve(),this._apiKey=e,(null==n?void 0:n.history)&&(function(e){let t=!1;for(let n of e){let{role:e,parts:s}=n;if(!t&&"user"!==e)throw new I(`First content should be with role 'user', got ${e}`);if(!O.includes(e))throw new I(`Each item should include role field. Got ${e} but valid roles are: ${JSON.stringify(O)}`);if(!Array.isArray(s))throw new I("Content should have 'parts' property with an array of Parts");if(0===s.length)throw new I("Each Content should have at least one part");let o={text:0,inlineData:0,functionCall:0,functionResponse:0,fileData:0,executableCode:0,codeExecutionResult:0};for(let e of s)for(let t of B)t in e&&(o[t]+=1);let i=K[e];for(let t of B)if(!i.includes(t)&&o[t]>0)throw new I(`Content with role '${e}' can't contain '${t}' part`);t=!0}}(n.history),this._history=n.history)}async getHistory(){return await this._sendPromise,this._history}async sendMessage(e,t={}){var n,s,o,i,a,r;let l;await this._sendPromise;let c=Y(e),d={safetySettings:null===(n=this.params)||void 0===n?void 0:n.safetySettings,generationConfig:null===(s=this.params)||void 0===s?void 0:s.generationConfig,tools:null===(o=this.params)||void 0===o?void 0:o.tools,toolConfig:null===(i=this.params)||void 0===i?void 0:i.toolConfig,systemInstruction:null===(a=this.params)||void 0===a?void 0:a.systemInstruction,cachedContent:null===(r=this.params)||void 0===r?void 0:r.cachedContent,contents:[...this._history,c]},u=Object.assign(Object.assign({},this._requestOptions),t);return this._sendPromise=this._sendPromise.then(()=>H(this._apiKey,this.model,d,u)).then(e=>{var t;if(e.response.candidates&&e.response.candidates.length>0){this._history.push(c);let n=Object.assign({parts:[],role:"model"},null===(t=e.response.candidates)||void 0===t?void 0:t[0].content);this._history.push(n)}else{let t=P(e.response);t&&console.warn(`sendMessage() was unsuccessful. ${t}. Inspect response object for details.`)}l=e}),await this._sendPromise,l}async sendMessageStream(e,t={}){var n,s,o,i,a,r;await this._sendPromise;let l=Y(e),c={safetySettings:null===(n=this.params)||void 0===n?void 0:n.safetySettings,generationConfig:null===(s=this.params)||void 0===s?void 0:s.generationConfig,tools:null===(o=this.params)||void 0===o?void 0:o.tools,toolConfig:null===(i=this.params)||void 0===i?void 0:i.toolConfig,systemInstruction:null===(a=this.params)||void 0===a?void 0:a.systemInstruction,cachedContent:null===(r=this.params)||void 0===r?void 0:r.cachedContent,contents:[...this._history,l]},d=Object.assign(Object.assign({},this._requestOptions),t),u=G(this._apiKey,this.model,c,d);return this._sendPromise=this._sendPromise.then(()=>u).catch(e=>{throw Error(q)}).then(e=>e.response).then(e=>{if(e.candidates&&e.candidates.length>0){this._history.push(l);let t=Object.assign({},e.candidates[0].content);t.role||(t.role="model"),this._history.push(t)}else{let t=P(e);t&&console.warn(`sendMessageStream() was unsuccessful. ${t}. Inspect response object for details.`)}}).catch(e=>{e.message!==q&&console.error(e)}),u}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function z(e,t,n,s){return(await R(t,p.COUNT_TOKENS,e,!1,JSON.stringify(n),s)).json()}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function X(e,t,n,s){return(await R(t,p.EMBED_CONTENT,e,!1,JSON.stringify(n),s)).json()}async function V(e,t,n,s){let o=n.requests.map(e=>Object.assign(Object.assign({},e),{model:t}));return(await R(t,p.BATCH_EMBED_CONTENTS,e,!1,JSON.stringify({requests:o}),s)).json()}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Z{constructor(e,t,n={}){this.apiKey=e,this._requestOptions=n,t.model.includes("/")?this.model=t.model:this.model=`models/${t.model}`,this.generationConfig=t.generationConfig||{},this.safetySettings=t.safetySettings||[],this.tools=t.tools,this.toolConfig=t.toolConfig,this.systemInstruction=k(t.systemInstruction),this.cachedContent=t.cachedContent}async generateContent(e,t={}){var n;let s=$(e),o=Object.assign(Object.assign({},this._requestOptions),t);return H(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null===(n=this.cachedContent)||void 0===n?void 0:n.name},s),o)}async generateContentStream(e,t={}){var n;let s=$(e),o=Object.assign(Object.assign({},this._requestOptions),t);return G(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null===(n=this.cachedContent)||void 0===n?void 0:n.name},s),o)}startChat(e){var t;return new J(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null===(t=this.cachedContent)||void 0===t?void 0:t.name},e),this._requestOptions)}async countTokens(e,t={}){let n=function(e,t){var n;let s={model:null==t?void 0:t.model,generationConfig:null==t?void 0:t.generationConfig,safetySettings:null==t?void 0:t.safetySettings,tools:null==t?void 0:t.tools,toolConfig:null==t?void 0:t.toolConfig,systemInstruction:null==t?void 0:t.systemInstruction,cachedContent:null===(n=null==t?void 0:t.cachedContent)||void 0===n?void 0:n.name,contents:[]},o=null!=e.generateContentRequest;if(e.contents){if(o)throw new N("CountTokensRequest must have one of contents or generateContentRequest, not both.");s.contents=e.contents}else if(o)s=Object.assign(Object.assign({},s),e.generateContentRequest);else{let t=Y(e);s.contents=[t]}return{generateContentRequest:s}}(e,{model:this.model,generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:this.cachedContent}),s=Object.assign(Object.assign({},this._requestOptions),t);return z(this.apiKey,this.model,n,s)}async embedContent(e,t={}){let n="string"==typeof e||Array.isArray(e)?{content:Y(e)}:e,s=Object.assign(Object.assign({},this._requestOptions),t);return X(this.apiKey,this.model,n,s)}async batchEmbedContents(e,t={}){let n=Object.assign(Object.assign({},this._requestOptions),t);return V(this.apiKey,this.model,e,n)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class W{constructor(e){this.apiKey=e}getGenerativeModel(e,t){if(!e.model)throw new I("Must provide a model name. Example: genai.getGenerativeModel({ model: 'my-model-name' })");return new Z(this.apiKey,e,t)}getGenerativeModelFromCachedContent(e,t,n){if(!e.name)throw new N("Cached content must contain a `name` field.");if(!e.model)throw new N("Cached content must contain a `model` field.");for(let n of["model","systemInstruction"])if((null==t?void 0:t[n])&&e[n]&&(null==t?void 0:t[n])!==e[n]){if("model"===n&&(t.model.startsWith("models/")?t.model.replace("models/",""):t.model)===(e.model.startsWith("models/")?e.model.replace("models/",""):e.model))continue;throw new N(`Different value for "${n}" specified in modelParams (${t[n]}) and cachedContent (${e[n]})`)}let s=Object.assign(Object.assign({},t),{model:e.model,tools:e.tools,toolConfig:e.toolConfig,systemInstruction:e.systemInstruction,cachedContent:e});return new Z(this.apiKey,s,n)}}let Q=null;async function ee(e){let t=(function(){if(!Q){let e=process.env.GEMINI_API_KEY;if(!e)throw Error("GEMINI_API_KEY is not configured. Please add it to your environment variables.");Q=new W(e)}return Q})().getGenerativeModel({model:"gemini-1.5-flash"}),n=`You are an expert ATS (Applicant Tracking System) analyzer. Analyze the following resume and provide a detailed assessment.

Provide your response in JSON format with these exact keys:
- score: number from 0-100 representing ATS compatibility
- keywordMatches: array of strong keywords found in the resume
- missingKeywords: array of common industry keywords that are missing
- strengths: array of 3-5 things done well
- improvements: array of 3-5 specific actionable improvements
- summary: 2-3 sentence overall assessment

Resume:
${e}

Respond ONLY with valid JSON, no markdown or explanation.`;try{let e=(await t.generateContent(n)).response.text().match(/\{[\s\S]*\}/);if(!e)throw Error("Failed to parse AI response");let s=JSON.parse(e[0]);return{score:s.score||50,keywordMatches:s.keywordMatches||[],missingKeywords:s.missingKeywords||[],strengths:s.strengths||[],improvements:s.improvements||[],summary:s.summary||"Analysis complete."}}catch(e){throw Error(`Resume analysis failed: ${e instanceof Error?e.message:"Unknown error"}`)}}var et=n(5655);let en={ats_analysis:1};async function es(e){try{let{resumeText:t,userId:n}=await e.json();if(!t)return C.NextResponse.json({error:"Resume text is required"},{status:400});if(n){let e=await (0,et.i)(),{data:t,error:s}=await e.from("profiles").select("scans").eq("id",n).single();if(s||!t)return C.NextResponse.json({error:"User not found"},{status:404});if(t.scans<en.ats_analysis)return C.NextResponse.json({error:"Insufficient scans. Please upgrade."},{status:402});let{error:o}=await e.rpc("deduct_scan",{p_user_id:n,p_amount:en.ats_analysis});if(o){let s=t.scans-en.ats_analysis;if(s<0)return C.NextResponse.json({error:"Insufficient scans"},{status:402});await e.from("profiles").update({scans:s}).eq("id",n)}await e.from("scan_logs").insert({user_id:n,action_type:"ats_analysis",scans_used:en.ats_analysis,created_at:new Date().toISOString()})}let s=await ee(t);return C.NextResponse.json(s)}catch(t){let e=t instanceof Error?t.message:"Analysis failed";return C.NextResponse.json({error:e},{status:500})}}let eo=new g.AppRouteRouteModule({definition:{kind:E.x.APP_ROUTE,page:"/api/ai/analyze/route",pathname:"/api/ai/analyze",filename:"route",bundlePath:"app/api/ai/analyze/route"},resolvedPagePath:"/app/frontend/src/app/api/ai/analyze/route.ts",nextConfigOutput:"",userland:m}),{requestAsyncStorage:ei,staticGenerationAsyncStorage:ea,serverHooks:er}=eo,el="/api/ai/analyze/route";function ec(){return(0,y.patchFetch)({serverHooks:er,staticGenerationAsyncStorage:ea})}},5655:(e,t,n)=>{n.d(t,{e:()=>i,i:()=>a});var s=n(2728),o=n(1615);async function i(){let e=await (0,o.cookies)();return(0,s.createServerClient)("https://oprnmnprfdpinkfaempv.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wcm5tbnByZmRwaW5rZmFlbXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTA2ODUsImV4cCI6MjA3ODY4NjY4NX0.SC-R2pSUeEIQhzNCat1zav-lN_JTiaBfCaDvm9JzVGc",{cookies:{getAll:()=>e.getAll(),setAll(t){try{t.forEach(({name:t,value:n,options:s})=>e.set(t,n,s))}catch{}}}})}async function a(){let e=await (0,o.cookies)(),t=process.env.SUPABASE_SERVICE_ROLE_KEY;return(0,s.createServerClient)("https://oprnmnprfdpinkfaempv.supabase.co",t||"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wcm5tbnByZmRwaW5rZmFlbXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTA2ODUsImV4cCI6MjA3ODY4NjY4NX0.SC-R2pSUeEIQhzNCat1zav-lN_JTiaBfCaDvm9JzVGc",{cookies:{getAll:()=>e.getAll(),setAll(t){try{t.forEach(({name:t,value:n,options:s})=>e.set(t,n,s))}catch{}}}})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),s=t.X(0,[948,972,637],()=>n(3554));module.exports=s})();