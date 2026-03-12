import { StoryCard } from './StoryCard';

type StoryItem = {
  id: string;
  title: string;
  tagline: string;
  category: string;
  narrative: string;
  keyFacts: string[];
  timestamp: string;
  eventCount: number;
};

type Props = {
  stories: StoryItem[];
};

export function StoryList({ stories }: Props) {
  if (stories.length === 0) {
    return <p className="text-sm text-[var(--t3)]">No stories available.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {stories.map((story) => (
        <StoryCard key={story.id} {...story} />
      ))}
    </div>
  );
}
