"use strict";(()=>{var e={};e.id=332,e.ids=[332],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},6426:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>h,patchFetch:()=>v,requestAsyncStorage:()=>p,routeModule:()=>d,serverHooks:()=>f,staticGenerationAsyncStorage:()=>m});var i={};r.r(i),r.d(i,{POST:()=>l});var s=r(9303),n=r(8716),a=r(670),o=r(7070),c=r(8928),u=r(5655);async function l(e){try{let{jobTitle:t,jobDescription:r,resumeText:i,count:s=10,userId:n}=await e.json();if(!t||!i)return o.NextResponse.json({error:"Job title and resume text are required"},{status:400});if(n){let e=await (0,u.e)(),{data:t}=await e.from("profiles").select("credits").eq("id",n).single();if(t&&t.credits<2)return o.NextResponse.json({error:"Insufficient credits. Interview questions require 2 credits."},{status:402});t&&await e.from("profiles").update({credits:t.credits-2}).eq("id",n)}let a=await (0,c.IG)(t,r||"",i,s);return o.NextResponse.json(a)}catch(t){let e=t instanceof Error?t.message:"Failed to generate questions";return o.NextResponse.json({error:e},{status:500})}}let d=new s.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/ai/interview-questions/route",pathname:"/api/ai/interview-questions",filename:"route",bundlePath:"app/api/ai/interview-questions/route"},resolvedPagePath:"/app/frontend/src/app/api/ai/interview-questions/route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:p,staticGenerationAsyncStorage:m,serverHooks:f}=d,h="/api/ai/interview-questions/route";function v(){return(0,a.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:m})}},8928:(e,t,r)=>{r.d(t,{IG:()=>o,ks:()=>a});var i=r(1258);let s=null;function n(){if(!s){let e=process.env.GEMINI_API_KEY;if(!e)throw Error("GEMINI_API_KEY is not configured. Please add it to your environment variables.");s=new i.$D(e)}return s}async function a(e){let t=n().getGenerativeModel({model:"gemini-1.5-flash"}),r=`Analyze the following resume and provide:
1. An overall score from 0-100
2. A list of 3-5 key strengths
3. A list of 3-5 areas for improvement
4. A brief summary (2-3 sentences)

Respond in JSON format with keys: score, strengths, improvements, summary

Resume:
${e}`;try{let e=(await t.generateContent(r)).response.text().match(/\{[\s\S]*\}/);if(!e)throw Error("Failed to parse AI response");return JSON.parse(e[0])}catch(e){throw Error(`Resume analysis failed: ${e instanceof Error?e.message:"Unknown error"}`)}}async function o(e,t,r,i=10){let s=n().getGenerativeModel({model:"gemini-1.5-flash"}),a=`Based on the job title, description, and candidate's resume below, generate ${i} tailored interview questions.

Job Title: ${e}

Job Description:
${t}

Candidate's Resume:
${r}

Generate questions that:
1. Are specific to this role and candidate
2. Cover technical skills, behavioral aspects, and situational scenarios
3. Range from easy to hard difficulty
4. Include tips for answering each question

Respond in JSON format with a "questions" array, where each question has:
- question: the interview question
- category: "technical", "behavioral", "situational", or "general"
- difficulty: "easy", "medium", or "hard"
- tips: brief advice for answering`;try{let e=(await s.generateContent(a)).response.text().match(/\{[\s\S]*\}/);if(!e)throw Error("Failed to parse AI response");return JSON.parse(e[0])}catch(e){throw Error(`Interview questions generation failed: ${e instanceof Error?e.message:"Unknown error"}`)}}},5655:(e,t,r)=>{r.d(t,{e:()=>n});var i=r(2728),s=r(1615);async function n(){let e=await (0,s.cookies)();return(0,i.createServerClient)("https://oprnmnprfdpinkfaempv.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wcm5tbnByZmRwaW5rZmFlbXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTA2ODUsImV4cCI6MjA3ODY4NjY4NX0.SC-R2pSUeEIQhzNCat1zav-lN_JTiaBfCaDvm9JzVGc",{cookies:{getAll:()=>e.getAll(),setAll(t){try{t.forEach(({name:t,value:r,options:i})=>e.set(t,r,i))}catch{}}}})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),i=t.X(0,[948,972,637,258],()=>r(6426));module.exports=i})();