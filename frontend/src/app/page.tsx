import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Sparkles, MessageSquare, Shield, Check, Zap, Target } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold">CraftlyCV</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/pricing"><Button variant="ghost">Pricing</Button></Link>
              <Link href="/auth"><Button>Get Started Free</Button></Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4" variant="secondary">🚀 AI-Powered Resume Analysis</Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Get Your ATS Score in Seconds
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stop guessing why you're not getting callbacks. Our AI analyzes your resume against real ATS systems and tells you exactly what to fix.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/auth">
              <Button size="lg" className="text-lg px-8 h-12">
                <Zap className="mr-2 h-5 w-5" />
                Analyze My Resume Free
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8 h-12">
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">✓ 10 free scans on signup • No credit card required</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 bg-blue-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600">50,000+</div>
            <div className="text-muted-foreground">Resumes Analyzed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">94%</div>
            <div className="text-muted-foreground">Avg Score Improvement</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">2.5x</div>
            <div className="text-muted-foreground">More Interviews</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">30 sec</div>
            <div className="text-muted-foreground">Analysis Time</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Everything You Need to Land Your Dream Job</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            From ATS optimization to interview prep, we've got you covered.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <Target className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>ATS Resume Analyzer</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get your ATS compatibility score, keyword matches, and specific improvements. Uses 1 scan.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-10 w-10 text-purple-600" />
                  <Badge variant="secondary">Pro</Badge>
                </div>
                <CardTitle>Tailor to Job</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Paste any job description and our AI rewrites your resume to match in 30 seconds. Uses 3 scans.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-10 w-10 text-green-600" />
                  <Badge variant="secondary">Pro</Badge>
                </div>
                <CardTitle>Interview Prep Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Generate tailored interview questions with ideal answers. Practice and get AI feedback. Uses 5 scans.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <Shield className="h-10 w-10 text-orange-600 mb-2" />
                <CardTitle>ATS Optimized Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Access professionally designed templates that pass ATS scans. 3 free, 20 for Pro users.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <FileText className="h-10 w-10 text-cyan-600 mb-2" />
                <CardTitle>Public Profile Page</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get your own craftlycv.in/u/yourname profile. Share with recruiters and stand out.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-10 w-10 text-yellow-600" />
                  <Badge variant="secondary">Pro</Badge>
                </div>
                <CardTitle>LinkedIn Optimizer</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Optimize your LinkedIn headline, summary, and experience bullets for more recruiter views. Uses 2 scans.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-6">Ready to Land More Interviews?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of job seekers who improved their resumes with CraftlyCV.
          </p>
          <Link href="/auth">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Start Free - 10 Scans Included
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <FileText className="h-6 w-6 text-blue-400" />
            <span className="text-lg font-bold text-white">CraftlyCV</span>
          </div>
          <div className="text-sm">© {new Date().getFullYear()} CraftlyCV. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
