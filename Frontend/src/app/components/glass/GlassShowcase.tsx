import React, { useState } from 'react';
import { GlassButton } from './GlassButton';
import { GlassInput } from './GlassInput';
import { GlassTextarea } from './GlassTextarea';
import { GlassSelect } from './GlassSelect';
import { GlassCard } from './GlassCard';
import { GlassToggle } from './GlassToggle';
import { GlassCheckbox } from './GlassCheckbox';
import { GlassRadio } from './GlassRadio';
import { GlassBadge } from './GlassBadge';
import { GlassTooltip } from './GlassTooltip';
import { GlassModal } from './GlassModal';
import { GlassNavbar } from './GlassNavbar';
import {
  Sparkles,
  Send,
  Heart,
  User,
  Mail,
  Search,
  Zap,
  Moon,
  Sun,
  Layers,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

type BackgroundType = 'gradient-light' | 'gradient-vibrant' | 'gradient-dark' | 'image';

const GlassShowcase: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [background, setBackground] = useState<BackgroundType>('gradient-vibrant');
  const [selectedOption, setSelectedOption] = useState('');

  const backgrounds = {
    'gradient-light': 'bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100',
    'gradient-vibrant': 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
    'gradient-dark': 'bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900',
    image: 'bg-[url(https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&auto=format&fit=crop)] bg-cover bg-center',
  };

  return (
    <div className={`min-h-screen ${backgrounds[background]} transition-all duration-700 relative overflow-hidden`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Navigation */}
      <GlassNavbar
        logo={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl text-white">Liquid Glass</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-4">
            <GlassTooltip content="Toggle theme">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg backdrop-blur-md bg-white/20 hover:bg-white/30 transition-colors border border-white/30"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-white" />
                ) : (
                  <Sun className="w-5 h-5 text-white" />
                )}
              </button>
            </GlassTooltip>
            <GlassButton variant="primary" size="sm" icon={<Sparkles className="w-4 h-4" />}>
              Get Started
            </GlassButton>
          </div>
        }
      >
        <a href="#" className="text-white/80 hover:text-white transition-colors text-sm">
          Components
        </a>
        <a href="#" className="text-white/80 hover:text-white transition-colors text-sm">
          Documentation
        </a>
        <a href="#" className="text-white/80 hover:text-white transition-colors text-sm">
          Examples
        </a>
      </GlassNavbar>

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl mb-4 text-white drop-shadow-lg">
            Liquid Glass Design System
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Modern glassmorphism components with multi-layered transparency, backdrop blur, and fluid organic shapes
          </p>

          {/* Background Switcher */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="text-sm text-white/80">Background:</span>
            {(Object.keys(backgrounds) as BackgroundType[]).map((bg) => (
              <button
                key={bg}
                onClick={() => setBackground(bg)}
                className={`
                  px-4 py-2 rounded-lg text-sm
                  backdrop-blur-md border transition-all
                  ${
                    background === bg
                      ? 'bg-white/30 border-white/50 text-white'
                      : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                  }
                `}
              >
                {bg.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ))}
          </div>

          {/* Design Tokens */}
          <GlassCard className="mb-12">
            <h3 className="text-2xl mb-6 text-white">Design Tokens</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div>
                <h4 className="text-sm uppercase tracking-wide text-white/70 mb-3">Blur Values</h4>
                <div className="space-y-2 text-sm text-white/90">
                  <div>Small: 12px</div>
                  <div>Medium: 16px</div>
                  <div>Large: 24px</div>
                  <div>XLarge: 32px</div>
                </div>
              </div>
              <div>
                <h4 className="text-sm uppercase tracking-wide text-white/70 mb-3">Border Radius</h4>
                <div className="space-y-2 text-sm text-white/90">
                  <div>Small: 8px</div>
                  <div>Medium: 12px</div>
                  <div>Large: 16px</div>
                  <div>XLarge: 24px</div>
                </div>
              </div>
              <div>
                <h4 className="text-sm uppercase tracking-wide text-white/70 mb-3">Opacity Layers</h4>
                <div className="space-y-2 text-sm text-white/90">
                  <div>Subtle: 0.15</div>
                  <div>Light: 0.25</div>
                  <div>Medium: 0.35</div>
                  <div>Strong: 0.45</div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Buttons */}
          <GlassCard header={<h3 className="text-xl text-white">Buttons</h3>} hover>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="text-sm text-white/70">Primary Variants</div>
                <div className="flex flex-wrap gap-3">
                  <GlassButton variant="primary" size="sm">
                    Small
                  </GlassButton>
                  <GlassButton variant="primary" size="md">
                    Medium
                  </GlassButton>
                  <GlassButton variant="primary" size="lg">
                    Large
                  </GlassButton>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-white/70">Color Variants</div>
                <div className="flex flex-wrap gap-3">
                  <GlassButton variant="primary">Primary</GlassButton>
                  <GlassButton variant="secondary">Secondary</GlassButton>
                  <GlassButton variant="success">Success</GlassButton>
                  <GlassButton variant="danger">Danger</GlassButton>
                  <GlassButton variant="ghost">Ghost</GlassButton>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-white/70">With Icons</div>
                <div className="flex flex-wrap gap-3">
                  <GlassButton variant="primary" icon={<Send className="w-4 h-4" />}>
                    Send Message
                  </GlassButton>
                  <GlassButton variant="success" icon={<Heart className="w-4 h-4" />} iconPosition="right">
                    Like
                  </GlassButton>
                  <GlassButton variant="ghost" icon={<Zap className="w-4 h-4" />}>
                    Quick Action
                  </GlassButton>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-white/70">States</div>
                <div className="flex flex-wrap gap-3">
                  <GlassButton variant="primary" disabled>
                    Disabled
                  </GlassButton>
                  <GlassButton variant="primary" fullWidth>
                    Full Width Button
                  </GlassButton>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Inputs */}
          <GlassCard header={<h3 className="text-xl text-white">Form Inputs</h3>} hover>
            <div className="space-y-4">
              <GlassInput label="Username" placeholder="Enter username" icon={<User className="w-5 h-5" />} />

              <GlassInput
                label="Email Address"
                type="email"
                placeholder="your@email.com"
                icon={<Mail className="w-5 h-5" />}
              />

              <GlassInput label="Search" placeholder="Search..." icon={<Search className="w-5 h-5" />} />

              <GlassInput label="With Error" error="This field is required" defaultValue="Invalid value" />

              <GlassInput label="With Helper Text" helperText="We'll never share your email" type="email" />
            </div>
          </GlassCard>

          {/* Textarea & Select */}
          <GlassCard header={<h3 className="text-xl text-white">Textarea & Select</h3>} hover>
            <div className="space-y-4">
              <GlassTextarea label="Message" placeholder="Type your message..." rows={4} />

              <GlassSelect
                label="Choose an option"
                options={[
                  { value: 'option1', label: 'Option One' },
                  { value: 'option2', label: 'Option Two' },
                  { value: 'option3', label: 'Option Three' },
                ]}
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
              />

              <GlassTextarea
                label="With Error"
                error="Message is too short"
                defaultValue="Short"
                rows={3}
              />
            </div>
          </GlassCard>

          {/* Form Controls */}
          <GlassCard header={<h3 className="text-xl text-white">Form Controls</h3>} hover>
            <div className="space-y-6">
              <div>
                <div className="text-sm text-white/70 mb-3">Toggles</div>
                <div className="space-y-3">
                  <GlassToggle label="Enable notifications" defaultChecked />
                  <GlassToggle label="Dark mode" />
                  <GlassToggle label="Disabled toggle" disabled />
                </div>
              </div>

              <div>
                <div className="text-sm text-white/70 mb-3">Checkboxes</div>
                <div className="space-y-3">
                  <GlassCheckbox label="Accept terms and conditions" defaultChecked />
                  <GlassCheckbox label="Subscribe to newsletter" />
                  <GlassCheckbox label="Disabled checkbox" disabled />
                </div>
              </div>

              <div>
                <div className="text-sm text-white/70 mb-3">Radio Buttons</div>
                <div className="space-y-3">
                  <GlassRadio name="plan" label="Free Plan" defaultChecked />
                  <GlassRadio name="plan" label="Pro Plan" />
                  <GlassRadio name="plan" label="Enterprise Plan" />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Badges & Tooltips */}
          <GlassCard header={<h3 className="text-xl text-white">Badges & Tooltips</h3>} hover>
            <div className="space-y-6">
              <div>
                <div className="text-sm text-white/70 mb-3">Badge Variants</div>
                <div className="flex flex-wrap gap-2">
                  <GlassBadge variant="default">Default</GlassBadge>
                  <GlassBadge variant="primary">Primary</GlassBadge>
                  <GlassBadge variant="success">Success</GlassBadge>
                  <GlassBadge variant="warning">Warning</GlassBadge>
                  <GlassBadge variant="danger">Danger</GlassBadge>
                </div>
              </div>

              <div>
                <div className="text-sm text-white/70 mb-3">Status Badges</div>
                <div className="flex flex-wrap gap-2">
                  <GlassBadge variant="success">Active</GlassBadge>
                  <GlassBadge variant="warning">Pending</GlassBadge>
                  <GlassBadge variant="danger">Cancelled</GlassBadge>
                  <GlassBadge variant="primary">New</GlassBadge>
                </div>
              </div>

              <div>
                <div className="text-sm text-white/70 mb-3">Tooltips</div>
                <div className="flex flex-wrap gap-4">
                  <GlassTooltip content="Tooltip on top" position="top">
                    <GlassButton variant="secondary" size="sm">
                      Hover me (top)
                    </GlassButton>
                  </GlassTooltip>
                  <GlassTooltip content="Tooltip on bottom" position="bottom">
                    <GlassButton variant="secondary" size="sm">
                      Hover me (bottom)
                    </GlassButton>
                  </GlassTooltip>
                  <GlassTooltip content="Tooltip on left" position="left">
                    <GlassButton variant="secondary" size="sm">
                      Hover me (left)
                    </GlassButton>
                  </GlassTooltip>
                  <GlassTooltip content="Tooltip on right" position="right">
                    <GlassButton variant="secondary" size="sm">
                      Hover me (right)
                    </GlassButton>
                  </GlassTooltip>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Cards */}
          <GlassCard header={<h3 className="text-xl text-white">Card Variants</h3>} hover>
            <div className="space-y-4">
              <GlassCard padding="sm">
                <div className="text-white">Small Padding Card</div>
                <div className="text-sm text-white/70 mt-1">This card has small padding</div>
              </GlassCard>

              <GlassCard padding="md" hover>
                <div className="text-white">Medium Padding with Hover</div>
                <div className="text-sm text-white/70 mt-1">Hover over this card to see the effect</div>
              </GlassCard>

              <GlassCard
                header={<div className="text-white">Card with Header & Footer</div>}
                footer={
                  <div className="flex gap-2">
                    <GlassButton variant="primary" size="sm">
                      Action
                    </GlassButton>
                    <GlassButton variant="ghost" size="sm">
                      Cancel
                    </GlassButton>
                  </div>
                }
                padding="md"
              >
                <div className="text-white/90">
                  This card demonstrates the header and footer sections with proper borders and spacing.
                </div>
              </GlassCard>
            </div>
          </GlassCard>

          {/* Modal */}
          <GlassCard header={<h3 className="text-xl text-white">Modal Dialog</h3>} hover>
            <div className="space-y-4">
              <p className="text-white/80">
                Click the button below to open a glass modal with blurred backdrop
              </p>
              <GlassButton variant="primary" onClick={() => setIsModalOpen(true)}>
                Open Modal
              </GlassButton>
            </div>
          </GlassCard>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <GlassCard padding="lg">
            <h3 className="text-2xl mb-4 text-white">Production-Ready Glass Components</h3>
            <p className="text-white/80 mb-6 max-w-2xl mx-auto">
              All components feature multi-layered transparency, backdrop blur (12-24px), subtle light refraction
              gradients, and maintain WCAG AA contrast ratios. Built with React, TypeScript, and Tailwind CSS.
            </p>
            <div className="flex justify-center gap-4">
              <GlassButton variant="primary" size="lg" icon={<Sparkles className="w-5 h-5" />}>
                Get Started
              </GlassButton>
              <GlassButton variant="secondary" size="lg">
                View Documentation
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Glass Modal Dialog"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <GlassButton variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" onClick={() => setIsModalOpen(false)}>
              Confirm
            </GlassButton>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-white/90">
            This is a glass modal with a blurred backdrop. Notice how the background is dimmed and blurred, while the
            modal itself maintains the liquid glass aesthetic.
          </p>

          <GlassInput label="Your Name" placeholder="Enter your name" />

          <GlassTextarea label="Message" placeholder="Type your message..." rows={4} />

          <div className="flex items-center gap-3">
            <GlassCheckbox label="I agree to the terms and conditions" />
          </div>
        </div>
      </GlassModal>
    </div>
  );
};

export default GlassShowcase;
