"use strict";(()=>{var e={};e.id=126,e.ids=[126],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},7697:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>h,patchFetch:()=>y,requestAsyncStorage:()=>d,routeModule:()=>p,serverHooks:()=>f,staticGenerationAsyncStorage:()=>m});var s={};r.r(s),r.d(s,{POST:()=>u});var a=r(9303),n=r(8716),i=r(670),o=r(7070),c=r(8928),l=r(5655);async function u(e){try{let{resumeText:t,userId:r}=await e.json();if(!t)return o.NextResponse.json({error:"Resume text is required"},{status:400});if(r){let e=await (0,l.e)(),{data:t}=await e.from("profiles").select("credits").eq("id",r).single();if(t&&t.credits<1)return o.NextResponse.json({error:"Insufficient credits. Please purchase more credits."},{status:402});t&&await e.from("profiles").update({credits:t.credits-1}).eq("id",r)}let s=await (0,c.ks)(t);return o.NextResponse.json(s)}catch(t){let e=t instanceof Error?t.message:"Analysis failed";return o.NextResponse.json({error:e},{status:500})}}let p=new a.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/ai/analyze-resume/route",pathname:"/api/ai/analyze-resume",filename:"route",bundlePath:"app/api/ai/analyze-resume/route"},resolvedPagePath:"/app/frontend/src/app/api/ai/analyze-resume/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:d,staticGenerationAsyncStorage:m,serverHooks:f}=p,h="/api/ai/analyze-resume/route";function y(){return(0,i.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:m})}},8928:(e,t,r)=>{r.d(t,{IG:()=>o,ks:()=>i});var s=r(1258);let a=null;function n(){if(!a){let e=process.env.GEMINI_API_KEY;if(!e)throw Error("GEMINI_API_KEY is not configured. Please add it to your environment variables.");a=new s.$D(e)}return a}async function i(e){let t=n().getGenerativeModel({model:"gemini-1.5-flash"}),r=`Analyze the following resume and provide:
1. An overall score from 0-100
2. A list of 3-5 key strengths
3. A list of 3-5 areas for improvement
4. A brief summary (2-3 sentences)

Respond in JSON format with keys: score, strengths, improvements, summary

Resume:
${e}`;try{let e=(await t.generateContent(r)).response.text().match(/\{[\s\S]*\}/);if(!e)throw Error("Failed to parse AI response");return JSON.parse(e[0])}catch(e){throw Error(`Resume analysis failed: ${e instanceof Error?e.message:"Unknown error"}`)}}async function o(e,t,r,s=10){let a=n().getGenerativeModel({model:"gemini-1.5-flash"}),i=`Based on the job title, description, and candidate's resume below, generate ${s} tailored interview questions.

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
- tips: brief advice for answering`;try{let e=(await a.generateContent(i)).response.text().match(/\{[\s\S]*\}/);if(!e)throw Error("Failed to parse AI response");return JSON.parse(e[0])}catch(e){throw Error(`Interview questions generation failed: ${e instanceof Error?e.message:"Unknown error"}`)}}},5655:(e,t,r)=>{r.d(t,{e:()=>n});var s=r(2728),a=r(1615);async function n(){let e=await (0,a.cookies)();return(0,s.createServerClient)("https://oprnmnprfdpinkfaempv.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wcm5tbnByZmRwaW5rZmFlbXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTA2ODUsImV4cCI6MjA3ODY4NjY4NX0.SC-R2pSUeEIQhzNCat1zav-lN_JTiaBfCaDvm9JzVGc",{cookies:{getAll:()=>e.getAll(),setAll(t){try{t.forEach(({name:t,value:r,options:s})=>e.set(t,r,s))}catch{}}}})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[948,972,637,258],()=>r(7697));module.exports=s})();