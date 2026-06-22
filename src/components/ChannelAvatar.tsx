import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const platformColors: Record<string, string> = {
  instagram: 'from-pink-500 via-purple-500 to-orange-400',
  facebook: 'from-blue-600 to-blue-500',
  threads: 'from-neutral-900 to-neutral-700',
  x: 'from-neutral-900 to-neutral-600',
  linkedin: 'from-blue-700 to-blue-500',
  youtube: 'from-red-600 to-red-500',
  gmb: 'from-blue-500 via-green-500 to-yellow-500',
  bluesky: 'from-sky-500 to-blue-500',
  mastodon: 'from-indigo-500 to-purple-600',
  wordpress: 'from-blue-800 to-blue-600',
  discord: 'from-indigo-600 to-purple-500',
  telegram: 'from-sky-500 to-blue-600',
  tumblr: 'from-slate-800 to-slate-600',
  slack: 'from-purple-700 to-purple-500',
  pinterest: 'from-red-600 to-red-500',
  reddit: 'from-orange-600 to-orange-400',
};

export function ChannelAvatar({
  src,
  name,
  platform,
  className,
}: {
  src?: string | null;
  name: string;
  platform: string;
  className?: string;
}) {
  const gradient = platformColors[platform] || 'from-muted-foreground/30 to-muted-foreground/10';
  const initial = (name || platform)?.[0]?.toUpperCase() || '?';

  return (
    <Avatar className={cn('shrink-0', className)}>
      {src && !src.includes('shadcn.png') ? (
        <AvatarImage src={src} />
      ) : null}
      <AvatarFallback>
        <div className={cn(
          'w-full h-full flex items-center justify-center bg-gradient-to-br',
          gradient
        )}>
          <span className="font-bold text-white/90 text-lg leading-none select-none">
            {initial}
          </span>
        </div>
      </AvatarFallback>
    </Avatar>
  );
}
