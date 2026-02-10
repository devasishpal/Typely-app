import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Keyboard, Target, TrendingUp, Trophy, Zap, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8 fade-in">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center scale-in shadow-lg overflow-hidden">
              <img
                src="/favicon.png"
                alt="Typely logo"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold gradient-text slide-up">
            Master Typing with TYPELY
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto slide-up">
            A comprehensive typing training platform designed to help you type faster, more accurately, and with confidence. From beginner to expert, we've got you covered.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center scale-in">
            <Button asChild size="lg" className="text-lg">
              <Link to="/signup">Get Started Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 gradient-bg">
        <h2 className="text-3xl font-bold text-center mb-12 gradient-text">Why Choose TYPELY?</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="card-hover">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Structured Lessons</CardTitle>
              <CardDescription>
                20 carefully designed lessons covering home row, top row, bottom row, numbers, special characters, and more
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center mb-4">
                <Keyboard className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle>Interactive Keyboard</CardTitle>
              <CardDescription>
                Real-time visual feedback with key highlighting and finger placement guidance
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <CardTitle>Detailed Analytics</CardTitle>
              <CardDescription>
                Track your WPM, accuracy, error patterns, and progress over time with comprehensive statistics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Achievements & Badges</CardTitle>
              <CardDescription>
                Earn achievements and unlock badges as you progress through lessons and improve your skills
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Multiple Training Modes</CardTitle>
              <CardDescription>
                Practice with structured courses, speed drills, accuracy challenges, and custom typing tests
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Progress Tracking</CardTitle>
              <CardDescription>
                Automatic progress saving with cross-device synchronization to continue learning anywhere
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 gradient-text">How It Works</h2>

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-card">
              1
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Create Your Account</h3>
              <p className="text-muted-foreground">
                Sign up with your email or Google account to get started in seconds
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-card">
              2
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Start with Basics</h3>
              <p className="text-muted-foreground">
                Begin with home row lessons and gradually progress through all keyboard sections
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-card">
              3
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Practice & Improve</h3>
              <p className="text-muted-foreground">
                Get real-time feedback, track your progress, and watch your typing speed and accuracy improve
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-card">
              4
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Earn Achievements</h3>
              <p className="text-muted-foreground">
                Complete lessons, reach milestones, and earn badges to showcase your typing mastery
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-4xl font-bold gradient-text">Ready to Improve Your Typing?</h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of users who have already improved their typing skills with TYPELY
          </p>
          <Button asChild size="lg" className="text-lg">
            <Link to="/signup">Start Learning Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-3">
              <div className="text-lg font-semibold">TYPELY</div>
              <p className="text-sm text-muted-foreground">
                Build speed, accuracy, and confidence with structured typing practice.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold tracking-wide">Support</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/support" className="hover:text-foreground transition-colors">
                    Support Center
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-foreground transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-foreground transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold tracking-wide">Company</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/about" className="hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/careers" className="hover:text-foreground transition-colors">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold tracking-wide">Legal</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 TYPELY. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
