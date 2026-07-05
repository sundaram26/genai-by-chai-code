export interface RawDocument {
  source_type: "youtube_video" | "youtube_comment" | "twitter_post" | "website_page" | "live_chat";
  source_id: string;
  url: string;
  author: string;
  published_at: string;
  language: string;
  topic_tags: string[];
  raw_text: string;
  raw_media_path?: string;
  platform: "youtube" | "twitter" | "web";
  context: "doubt" | "reply" | "explanation" | "joke" | "serious" | "live";
}

export interface ChunkAnalysis {
  topics: string[];
  teaching_style: string[];
  tone: string[];
  sentence_length: "short" | "medium" | "long";
  humor_level: "low" | "medium" | "high";
  directness: "low" | "medium" | "high";
  common_phrases: string[];
  favorite_words: string[];
  emoji_style: string[];
  example_analogies: string[];
  answer_patterns: string[];
  correction_style: string[];
  motivation_style: string[];
  platform_style: {
    youtube_comment?: Record<string, any>;
    twitter_reply?: Record<string, any>;
    live_chat?: Record<string, any>;
  };
  facts_mentioned: string[];
  confidence: number;
}

export interface PersonaIdentity {
  name: string;
  public_role: string;
  teaching_scope: string[];
  audience: string;
  subject_boundaries: string[];
  known_for: string[];
}

export interface PersonaCommunication {
  tone: string[];
  sentence_length: "short" | "medium" | "long";
  humor_level: "low" | "medium" | "high";
  directness: "low" | "medium" | "high";
  start_patterns: string[];
  end_patterns: string[];
  correction_style: string;
  motivation_style: string;
}

export interface PlatformMode {
  tone: string;
  style_rules: string[];
  constraints: string[];
}

export interface ExampleReply {
  question: string;
  answer: string;
  platform: "youtube" | "twitter" | "live" | "formal";
  mood: "brief" | "casual" | "serious" | "encouraging" | "corrective";
  intent: string;
}

export interface PersonaCard {
  identity: PersonaIdentity;
  communication: PersonaCommunication;
  platform_modes: {
    youtube: PlatformMode;
    twitter: PlatformMode;
    live: PlatformMode;
    formal: PlatformMode;
  };
  phrase_bank: string[];
  anti_style: string[];
  knowledge: string[];
  example_replies: ExampleReply[];
}
