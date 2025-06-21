import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = `${process.env.NOTION_DATABASE_ID}`;

/**
 * Logs a newly created memory to a Notion database.
 * This is a "fire-and-forget" function and should not block the main response.
 * @param {object} memory - The memory object created in the database.
 * @param {object} user - The user object associated with the memory.
 */
export const logMemoryToNotion = async (memory, user) => {
  console.log(process.env.NOTION_TOKEN)

  try {
    console.log(`Logging memory "${memory.title}" to Notion...`);

    const properties = {
      "Title": {
        title: [{ text: { content: memory.title || 'Untitled Memory' } }],
      },
      "User Name": {
        rich_text: [{ text: { content: user.name || 'Guest' } }],
      },
      "Type": {
        select: { name: memory.type || 'text' },
      },
      "Summary": {
        rich_text: [{ text: { content: memory.aiSummary || 'No summary available.' } }],
      },
    };

    if (memory.mood) {
      properties["Mood"] = { select: { name: memory.mood } };
    }
    
    if (memory.audioUrl) {
      properties["Audio URL"] = { url: memory.audioUrl };
    }

    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: properties,
    });

    console.log("Successfully logged memory to Notion.");
  } catch (error) {
    console.error("Error logging memory to Notion:", error.message);
  }
}; 