import * as fs from "fs/promises";
import * as path from "path";
import * as cheerio from "cheerio";
import { RawDocument } from "../types";

// Scrapes transcript captions directly from public YouTube videos without API keys
async function fetchYoutubeTranscript(videoUrl: string): Promise<string> {
  try {
    const match = videoUrl.match(/(?:v=|\/embed\/|\/watch\?v=|\/shorts\/|youtu\.be\/)([^#\&\?]+)/);
    if (!match) {
      throw new Error(`Could not parse video ID from URL: ${videoUrl}`);
    }
    const videoId = match[1];

    console.log(`Scraping YouTube captions for video ID: ${videoId}`);
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch YouTube watch page: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract captions JSON metadata
    const captionsMatch = html.match(/"captions":\s*({[\s\S]*?})\s*,\s*"videoDetails"/);
    if (!captionsMatch) {
      throw new Error("No caption tracks found in this video's page source. Auto-captions may be disabled.");
    }

    const captionsJson = JSON.parse(captionsMatch[1]);
    const captionTracks = captionsJson.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captionTracks || captionTracks.length === 0) {
      throw new Error("No caption tracks available for download.");
    }

    // Prefer English/Hinglish or take first track
    const track = captionTracks.find((t: any) => t.languageCode === "en" || t.languageCode === "hi") || captionTracks[0];
    const trackUrl = track.baseUrl;
    if (!trackUrl) {
      throw new Error("Base URL for caption track was undefined.");
    }

    const trackResponse = await fetch(trackUrl);
    if (!trackResponse.ok) {
      throw new Error("Failed to download caption track XML payload.");
    }

    const xml = await trackResponse.text();
    
    // Strip XML formatting tags to recover clean transcription text
    const cleanText = xml
      .replace(/<text[^>]*>([\s\S]*?)<\/text>/gi, " $1 ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    return cleanText;
  } catch (err: any) {
    console.warn(`YouTube Caption Download failed for URL ${videoUrl}:`, err.message);
    // Return placeholder metadata if scrape failed (due to bot blocking or disabled captions)
    return `[YouTube Video Transcript placeholder for video url: ${videoUrl}]`;
  }
}

// Cleans webpage HTML to extract human-readable article content using Cheerio
function extractWebpageText(html: string): string {
  const $ = cheerio.load(html);
  
  // Remove noisy elements that shouldn't be trained on
  $('script, style, nav, footer, header, noscript, iframe, aside').remove();
  
  let extractedText = "";
  
  // Select meaningful content tags
  $('p, h1, h2, h3, h4, h5, h6, li').each((_, el) => {
    const text = $(el).text().trim();
    if (text) {
      extractedText += text + "\n";
    }
  });

  // Fallback to body text if structured tags are missing
  if (!extractedText.trim()) {
    extractedText = $('body').text() || "";
  }

  // Clean excessive whitespace
  return extractedText.replace(/\s+/g, " ").trim();
}

// Recursive BFS web crawler to extract up to maxPages from a domain
async function crawlDomain(startUrl: string, maxPages: number, personaName: string, startIndex: number): Promise<RawDocument[]> {
  const visited = new Set<string>();
  const queue: string[] = [startUrl];
  const docs: RawDocument[] = [];
  
  let baseUrlObj: URL;
  try {
    baseUrlObj = new URL(startUrl);
  } catch (err) {
    console.error(`Invalid start URL: ${startUrl}`);
    return docs;
  }
  
  const baseDomain = baseUrlObj.hostname;
  console.log(`\n--- Starting Web Crawler for domain: ${baseDomain} (Limit: ${maxPages} pages) ---`);
  
  while (queue.length > 0 && visited.size < maxPages) {
    const currentUrl = queue.shift()!;
    // Normalize URL to prevent duplicates (remove anchors and trailing slashes)
    const normalizedUrl = currentUrl.split('#')[0].replace(/\/$/, "");
    
    if (visited.has(normalizedUrl)) continue;
    visited.add(normalizedUrl);
    
    console.log(`[Crawler ${visited.size}/${maxPages}] Fetching: ${normalizedUrl}`);
    
    try {
      const response = await fetch(normalizedUrl, {
        headers: { "User-Agent": "Persona-Crawler/1.0" }
      });
      
      if (!response.ok) {
        console.log(`[Crawler] Warning: Failed to fetch ${normalizedUrl} - Status: ${response.status}`);
        continue;
      }
      
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        console.log(`[Crawler] Skipping non-HTML file.`);
        continue;
      }
      
      const html = await response.text();
      
      // Discover internal links
      const hrefRegex = /href=["']([^"']+)["']/gi;
      let match;
      while ((match = hrefRegex.exec(html)) !== null) {
        const link = match[1];
        try {
          const resolvedUrl = new URL(link, normalizedUrl);
          // Only queue links on the same domain
          if (resolvedUrl.hostname === baseDomain && (resolvedUrl.protocol === "http:" || resolvedUrl.protocol === "https:")) {
            const cleanResolvedUrl = resolvedUrl.href.split('#')[0].replace(/\/$/, "");
            if (!visited.has(cleanResolvedUrl) && !queue.includes(cleanResolvedUrl)) {
              queue.push(cleanResolvedUrl);
            }
          }
        } catch (e) {
          // ignore invalid href structures
        }
      }
      
      const cleanText = extractWebpageText(html);
      
      // Skip empty or purely visual pages with very little text
      if (cleanText.length > 50) {
        docs.push({
          source_type: "website_page",
          source_id: `web_${startIndex}_${visited.size}_${Date.now()}`,
          url: normalizedUrl,
          author: "webpage",
          published_at: new Date().toISOString(),
          language: "en",
          topic_tags: ["webpage_crawled"],
          raw_text: cleanText,
          platform: "web",
          context: "explanation"
        });
      } else {
        console.log(`[Crawler] Skipped saving ${normalizedUrl} (insufficient readable text).`);
      }
    } catch (err: any) {
      console.error(`[Crawler] Error fetching ${normalizedUrl}:`, err.message);
    }
  }
  
  console.log(`--- Crawler finished. Extracted ${docs.length} valid pages from ${baseDomain} ---\n`);
  return docs;
}

export async function ingestSources(
  personaName: string,
  inputs: {
    youtube?: string[];
    website?: string[];
    twitter?: string[];
    text?: string[];
  }
): Promise<string> {
  const personaSlug = personaName.toLowerCase().replace(/\s+/g, "_");
  const dirPath = path.resolve(__dirname, "../../data", personaSlug, "raw");
  await fs.mkdir(dirPath, { recursive: true });

  const rawDocs: RawDocument[] = [];

  // Ingest manual text chunks
  if (inputs.text) {
    const textList = inputs.text.filter(Boolean);
    for (let i = 0; i < textList.length; i++) {
      const text = textList[i];
      const doc: RawDocument = {
        source_type: "website_page",
        source_id: `text_${i}_${Date.now()}`,
        url: "internal",
        author: personaName,
        published_at: new Date().toISOString(),
        language: "en",
        topic_tags: ["manual_input"],
        raw_text: text,
        platform: "web",
        context: "explanation"
      };
      rawDocs.push(doc);
    }
  }

  // Ingest websites via automated recursive Web Crawler
  if (inputs.website) {
    const urls = inputs.website.filter(Boolean);
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        const maxPagesLimit = 15; // Set safe extraction limit
        const crawledDocs = await crawlDomain(url, maxPagesLimit, personaName, i);
        rawDocs.push(...crawledDocs);
      } catch (err) {
        console.error(`Failed to initiate crawler for URL: ${url}`, err);
      }
    }
  }

  // Ingest and extract YouTube transcripts
  if (inputs.youtube) {
    const urls = inputs.youtube.filter(Boolean);
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        const transcriptText = await fetchYoutubeTranscript(url);
        const doc: RawDocument = {
          source_type: "youtube_video",
          source_id: `yt_${i}_${Date.now()}`,
          url,
          author: personaName,
          published_at: new Date().toISOString(),
          language: "en",
          topic_tags: ["youtube_video"],
          raw_text: transcriptText,
          platform: "youtube",
          context: "live"
        };
        rawDocs.push(doc);
      } catch (err) {
        console.error(`Failed to download YouTube transcript for URL: ${url}`, err);
      }
    }
  }

  // Ingest tweets
  if (inputs.twitter) {
    const tweets = inputs.twitter.filter(Boolean);
    for (let i = 0; i < tweets.length; i++) {
      const tweetText = tweets[i];
      const doc: RawDocument = {
        source_type: "twitter_post",
        source_id: `tweet_${i}_${Date.now()}`,
        url: `https://twitter.com/status/${i}_${Date.now()}`,
        author: personaName,
        published_at: new Date().toISOString(),
        language: "en",
        topic_tags: ["tweet"],
        raw_text: tweetText,
        platform: "twitter",
        context: "reply"
      };
      rawDocs.push(doc);
    }
  }

  // Save all raw documents inside raw/ directory
  for (const doc of rawDocs) {
    const filePath = path.join(dirPath, `${doc.source_id}.json`);
    await fs.writeFile(filePath, JSON.stringify(doc, null, 2), "utf8");
  }

  return dirPath;
}
