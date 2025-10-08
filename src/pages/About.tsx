import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Target, Zap, Award } from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: Shield,
      title: 'Advanced Detection',
      description: 'State-of-the-art AI models for accurate helmet detection in various conditions',
    },
    {
      icon: Target,
      title: 'High Accuracy',
      description: '94.6% detection accuracy with continuous model improvements',
    },
    {
      icon: Zap,
      title: 'Real-time Processing',
      description: 'Process images and video streams in real-time with minimal latency',
    },
    {
      icon: Award,
      title: 'Reliable Performance',
      description: '99.9% uptime with enterprise-grade infrastructure',
    },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">About</h1>
          <p className="text-muted-foreground">
            Learn more about our helmet detection system
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Our helmet detection system is designed to enhance workplace safety by automatically
                identifying whether individuals are wearing proper protective equipment. Using advanced
                computer vision and machine learning algorithms, we provide accurate, real-time
                detection capabilities for both static images and live video feeds.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We aim to reduce workplace accidents and ensure compliance with safety regulations
                through cutting-edge technology that's easy to deploy and use.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Technology Stack</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-secondary/50 p-4">
                  <h3 className="mb-2 font-semibold text-foreground">Computer Vision</h3>
                  <p className="text-sm text-muted-foreground">
                    Advanced image processing and object detection algorithms
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <h3 className="mb-2 font-semibold text-foreground">Machine Learning</h3>
                  <p className="text-sm text-muted-foreground">
                    Deep neural networks trained on thousands of images
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <h3 className="mb-2 font-semibold text-foreground">Cloud Infrastructure</h3>
                  <p className="text-sm text-muted-foreground">
                    Scalable and reliable cloud-based processing
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;
