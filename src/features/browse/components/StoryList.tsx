import { StoryCard } from './StoryCard';

type StoryEvent = {
  id: string;
  time: string;
  label: string;
  type: string;
};

type StoryItem = {
  id: string;
  title: string;
  tagline: string;
  category: string;
  narrative: string;
  keyFacts: string[];
  timestamp: string;
  events: StoryEvent[];
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
        <StoryCard
          key={story.id}
          id={story.id}
          title={story.title}
          tagline={story.tagline}
          category={story.category}
          narrative={story.narrative}
          keyFacts={story.keyFacts}
          timestamp={story.timestamp}
          eventCount={story.events.length}
        />
      ))}
    </div>
  );
}
