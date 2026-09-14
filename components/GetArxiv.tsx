import axios from "axios";
import { getRandomOffset } from "@/utils/others/quillutils";

const xml2js = require("xml2js");

interface ArxivFeed {
  feed: {
    xmlns: string;
    entry: ArxivEntry[];
    id: string[];
    link: Array<{ [key: string]: string }>;
    "opensearch:itemsPerPage": Array<{ [key: string]: string }>;
    "opensearch:startIndex": Array<{ [key: string]: string }>;
    "opensearch:totalResults": Array<{ [key: string]: string }>;
    title: Array<{ [key: string]: string }>;
    updated: string[];
  };
}

interface ArxivEntry {
  "arxiv:comment": Array<{ [key: string]: string }>;
  "arxiv:primary_category": Array<{ [key: string]: string }>;
  author: Author[];
  category: Array<{ [key: string]: string }>;
  id: string[];
  link: Array<{ [key: string]: string }>;
  published: string[];
  summary: string[];
  title: string[];
  updated: string[];
}

interface Author {
  name: string;
  affiliation?: string;
}

async function getArxivPapers(
  query: string,
  maxResults = 2,
  offset = -1,
  sortBy = "submittedDate",
  sortOrder = "descending"
) {
  const maxOffset = 30 - maxResults;
  if (offset === -1) offset = getRandomOffset(maxOffset);
  console.log("offset in arxiv", offset);
  const url = `https://proxy.14790897.xyz/proxy/https://export.arxiv.org/api/query?search_query=${query}&start=${offset}&max_results=${maxResults}&sortBy=${sortBy}&sortOrder=${sortOrder}`;

  try {
    const response = await axios.get(url);
    let result = await xml2js.parseStringPromise(response.data);
    console.log(result);
    result = extractArxivData(result);
    return result;
  } catch (error: any) {
    const status = error?.response?.status;
    const statusText = error?.response?.statusText;
    const responseData = error?.response?.data;
    let detail = error?.message || "unknown error";

    if (responseData !== undefined) {
      try {
        detail =
          typeof responseData === "string"
            ? responseData
            : JSON.stringify(responseData);
      } catch {
        detail = error?.message || "unserializable response";
      }
    }

    const httpStatus = status
      ? ` HTTP ${status}${statusText ? ` ${statusText}` : ""}`
      : "";
    throw new Error(
      `Arxiv失败（请使用英文并缩短关键词）${httpStatus}: ${detail}`
    );
  }
}

function extractArxivData(data: ArxivFeed) {
  const entries = data.feed.entry.slice(0, 2);

  const extractedData = entries.map((entry: ArxivEntry) => {
    return {
      id: entry.id[0],
      published: entry.published[0],
      title: entry.title[0],
      abstract: entry.summary[0],
      authors: entry.author.map((author) => author.name[0]),
    };
  });
  return extractedData;
}

export default getArxivPapers;
