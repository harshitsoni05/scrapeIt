import requests 
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import json


class WebsiteScraper:
    def __init__(self, base_url, max_depth=2):
        """
        Initialize the scraper.
        :param base_url: The base URL of the website to scrape.
        :param max_depth: Maximum depth to recurse while crawling.
        """
        self.base_url = base_url
        self.visited = set()
        self.site_content = {}
        self.max_depth = max_depth
        self.data = {'children':{}}

    def is_same_domain(self, url):
        """
        Check if the URL belongs to the same domain as the base URL.
        """
        base_domain = urlparse(self.base_url).netloc
        url_domain = urlparse(url).netloc
        return base_domain in url_domain

    def get_links(self, soup, base_url):
        """
        Extract all links from the page that belong to the same domain.
        """
        links = set()
        for a_tag in soup.find_all("a", href=True):
            href = urljoin(base_url, a_tag['href'])
            if self.is_same_domain(href):
                links.add(href)
        return links

    def scrape_page(self, url):
        """
        Scrape content from a single page.
        """
        try:
            response = requests.get(url)
            if response.status_code != 200:
                return None
            soup = BeautifulSoup(response.content, "html.parser")

            # Extract meaningful content
            content = {
                "title": soup.title.string if soup.title else "No Title",
                "headings": [h.get_text(strip=True) for h in soup.find_all(['h1', 'h2', 'h3'])],
                "paragraphs": [p.get_text(strip=True) for p in soup.find_all('p')],
                "links": list(self.get_links(soup, url))  # Convert set to list
            }
            return content
        except Exception as e:
            print(f"Error scraping {url}: {e}")
            return None 

    def fitIntoResult(self, url, content):
        base_domain = urlparse(self.base_url).netloc
        uri = url.split("https://"+base_domain)
        uri=uri[1]
        if "#" in uri or "?" in uri:
            return
        uri = uri.split("/")
        if uri[-1]=="":
            uri=uri[:-1]
        print (uri)
        dic = self.data
        for i in range(1,len(uri)):
            dic = dic["children"]
            if uri[i] in dic:
                dic = dic[uri[i]]
            else:
                dic[uri[i]] = {"children": {}}
                dic=dic[uri[i]]
        dic["content"]=self.parse_content(content)


    def parse_content(self, content):
        context = []
        if 'title' in content and content['title']!="":
            context = [{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":content["title"]}]}]

        lis = content["headings"]
        text = ""
        for i in range(len(lis)-1):
            text += (lis[i] + ", ")
        if (len(lis)>0):
            text += lis[len(lis)-1]

        if text!="":
            headings = {"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"Headings - "},{"type":"text","text":text}]}
            context.append(headings)
        
        paragraph = {"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"Paragraphs - "}]}
        context.append(paragraph)
        

        lis = content["paragraphs"]
        for i in range(len(lis)):
            if lis[i]!="":
                para = {"type":"paragraph","content":[{"type":"text","text":lis[i]}]}
                context.append(para)
        
        root = { "type":"doc" , "content" : context}
        return root
        
    

    def scrape_website(self, url, depth=0):
        """
        Crawl and scrape the entire website starting from the base URL.
        Restricts recursion depth with max_depth.
        :param url: The URL to scrape.
        :param depth: Current depth of recursion.
        """
        if url in self.visited or depth > self.max_depth:
            return
        self.visited.add(url)

        content = self.scrape_page(url)
        if content:
            self.site_content[url] = content
            self.fitIntoResult(url, content)

            # Recursively scrape links, increasing depth
            for link in content["links"]:
                self.scrape_website(link, depth + 1)

    def save_to_json(self, file_name):
        """
        Save the site content to a JSON file.
        """
        with open(file_name, "w") as f:
            json.dump(self.data, f, indent=4)
        print(f"Website content saved to {file_name}")

    def add_keys(self, json_obj):
        """
        Adds a 'keys' object to every level of the provided dictionary,
        storing names of immediate children.
        
        :param json_obj: The input dictionary to process
        """
        # Base case: If 'children' key doesn't exist, return
        if 'children' not in json_obj:
            return
        
        # Add 'keys' with immediate children names
        json_obj['keys'] = list(json_obj['children'].keys())
        
        # Recursively process all children
        for child_name, child_value in json_obj['children'].items():
            self.add_keys(child_value)


# Usage
if __name__ == "__main__":
    base_url = "https://docs.mixpanel.com/docs/what-is-mixpanel"  # Replace with your target website
    max_depth = 1  # Set maximum depth
    scraper = WebsiteScraper(base_url, max_depth)
    scraper.scrape_website(base_url)
    scraper.add_keys(scraper.data)
    scraper.save_to_json("website_content.json")
