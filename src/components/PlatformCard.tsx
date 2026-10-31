import React from 'react';
import {
  Github,
  Twitter,
  Youtube,
  Instagram,
  Send,
  MessageCircle,
  MessageSquare,
  Music,
  Camera,
  Video,
  Tv,
  Gamepad2,
  GitBranch,
  Box,
  HelpCircle,
  Key,
  Palette,
  Layers,
  Sparkles,
  BookOpen,
  DollarSign,
  Activity,
  Globe,
  Terminal,
  Briefcase,
  Mail,
  UserCheck,
  AtSign,
  Cloud,
  Share2,
  PhoneCall,
  FileText,
  Image as ImageIcon,
  Radio,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Code,
  Coffee,
  Link as LinkIcon,
  Package,
  Film,
  Bot,
  Cpu,
  Compass,
  Award,
  Bookmark,
  PenTool,
  Headphones,
  Ghost,
  Layout,
  Trophy,
  Zap,
  Hash,
} from 'lucide-react';
import { PlatformResult } from '../types/osint';
import { PLATFORMS_CATALOG } from '../data/platforms';

// Direct mapping of icon names declared in platforms.ts to Lucide React components
const ICON_COMPONENT_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Github,
  Twitter,
  Youtube,
  Instagram,
  Send,
  MessageCircle,
  MessageSquare,
  Music,
  Camera,
  Video,
  Tv,
  Gamepad2,
  GitBranch,
  Box,
  HelpCircle,
  Key,
  Palette,
  Layers,
  Sparkles,
  BookOpen,
  DollarSign,
  Activity,
  Globe,
  Terminal,
  Briefcase,
  Mail,
  UserCheck,
  AtSign,
  Cloud,
  Share2,
  PhoneCall,
  FileText,
  Image: ImageIcon,
  Radio,
  Code,
  Coffee,
  Link: LinkIcon,
  Package,
  Film,
  Bot,
  Cpu,
  Compass,
  Award,
  Bookmark,
  PenTool,
  Headphones,
  Ghost,
  Layout,
  Trophy,
  Zap,
  Hash,
};

// Fallback ID-based brand icon mapping if an icon name is varied
const PLATFORM_ID_FALLBACKS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  reddit: MessageCircle,
  telegram: Send,
  pinterest: ImageIcon,
  medium: FileText,
  youtube: Youtube,
  twitter: Twitter,
  github: Github,
  discord: MessageSquare,
  spotify: Music,
  steam: Gamepad2,
  linkedin: Briefcase,
  google: Mail,
  gravatar: UserCheck,
  microsoft: Terminal,
  apple: Key,
  twitch: Tv,
  tiktok: Video,
  gitlab: GitBranch,
  bitbucket: GitBranch,
  docker: Box,
  stackoverflow: HelpCircle,
  threads: AtSign,
  bluesky: Cloud,
  mastodon: Share2,
  soundcloud: Radio,
  dribbble: Sparkles,
  patreon: DollarSign,
  buymeacoffee: Coffee,
  linktree: LinkIcon,
  quora: HelpCircle,
  strava: Activity,
  duolingo: BookOpen,
  keybase: Key,
  skype: PhoneCall,
  signal: MessageCircle,
  whatsapp: Send,
  adobe: Palette,
  behance: Layers,
  substack: BookOpen,
  codepen: Code,
  replit: Bot,
  kaggle: Cpu,
  leetcode: Code,
  codeforces: Trophy,
  npm: Package,
  pypi: Package,
  devto: Code,
  hashnode: FileText,
  producthunt: Compass,
  figma: PenTool,
  canva: Layout,
  chess: Award,
  roblox: Gamepad2,
  kick: Zap,
  vimeo: Film,
  bandcamp: Headphones,
  flickr: Camera,
  goodreads: Bookmark,
  letterboxd: Film,
  aboutdotme: UserCheck,
  tumblr: Hash,
};

interface PlatformCardProps {
  platform: PlatformResult;
}

export const PlatformCard: React.FC<PlatformCardProps> = ({ platform }) => {
  // Find curated definition for domain and brand color
  const definition = PLATFORMS_CATALOG.find((p) => p.id === platform.id);

  // Resolve dynamic icon: check icon map, then ID fallback, then default to Globe
  const IconComponent =
    (platform.icon && ICON_COMPONENT_MAP[platform.icon]) ||
    (definition?.icon && ICON_COMPONENT_MAP[definition.icon]) ||
    PLATFORM_ID_FALLBACKS[platform.id] ||
    Globe;

  const brandColor = definition?.color || '#38bdf8';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all group">
      <div>
        {/* Header: Dynamic Brand Icon + Platform Name + Status */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            {/* Dynamic Brand Icon Container with Tinted Accent */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105"
              style={{
                backgroundColor: `${brandColor}18`,
                borderColor: `${brandColor}40`,
                color: brandColor,
              }}
              title={`${platform.name} Brand Icon`}
            >
              <IconComponent className="w-4 h-4" />
            </div>

            <div>
              <span className="text-sm font-semibold text-white block leading-tight">{platform.name}</span>
              <span className="text-[10px] text-slate-500 capitalize">{platform.category}</span>
            </div>
          </div>

          {/* Verification Status */}
          <div className="text-xs font-mono">
            {platform.status === 'found' && (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Found
              </span>
            )}
            {platform.status === 'likely' && (
              <span className="text-cyan-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Likely
              </span>
            )}
            {platform.status === 'not_found' && (
              <span className="text-slate-500 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-slate-500" /> Unregistered
              </span>
            )}
            {platform.status === 'rate_limited' && (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Rate Limited
              </span>
            )}
            {platform.status === 'unknown' && (
              <span className="text-slate-600">Unindexed</span>
            )}
          </div>
        </div>

        {/* Display Name */}
        {platform.displayName && (
          <p className="text-xs text-slate-300 font-medium truncate mt-1">
            <span className="text-slate-500 font-normal">Identified: </span>
            {platform.displayName}
          </p>
        )}

        {/* Bio / Bio snippet */}
        {platform.bio && (
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 italic">
            "{platform.bio}"
          </p>
        )}

        {/* Technical Key-Value Metadata */}
        {platform.details && Object.keys(platform.details).length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1 font-mono">
            {Object.entries(platform.details).map(([k, v]) => (
              <div key={k} className="flex justify-between items-center gap-2">
                <span className="text-slate-500 truncate">{k}:</span>
                <span className="text-slate-300 font-medium truncate">{String(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer: Source Protocol & External Pivot Link */}
      <div className="mt-3.5 pt-2.5 flex items-center justify-between text-xs border-t border-slate-800/60">
        <span className="text-[10px] text-slate-500 font-mono">
          {definition?.domain || 'public_index'}
        </span>

        {platform.profileUrl && (
          <a
            href={platform.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-medium text-xs transition-colors"
          >
            <span>Open Profile</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
