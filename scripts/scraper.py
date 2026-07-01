import requests
from bs4 import BeautifulSoup
import json
import re
import urllib.parse
import time

def fetch_url(url, timeout=10):
    try:
        print(f"Fetching {url}...")
        response = requests.get(url, timeout=timeout, verify=False)
        if response.status_code == 200:
            return response.text
    except Exception as e:
        print(f"Error fetching {url}: {e}")
    return None

def extract_secretariats(html):
    soup = BeautifulSoup(html, 'html.parser')
    secretariats = []
    
    # In Sobral's portal, secretariats are typically in a dropdown with id="dropdown103" or text "Secretarias"
    dropdowns = soup.find_all('a', class_='dropdown-toggle')
    for d in dropdowns:
        if 'Secretarias' in d.text:
            ul = d.find_next_sibling('ul', class_='dropdown-menu')
            if ul:
                links = ul.find_all('a')
                for link in links:
                    name = link.text.strip()
                    url = link.get('href')
                    if url and url.startswith('http'):
                        secretariats.append({'name': name, 'url': url})
    return secretariats

def extract_address_info(soup, url):
    equipments = []
    # Try to find common address patterns in text blocks
    # Look for lists or paragraphs containing "Rua", "Av.", "Telefone", "Bairro"
    
    # We will look at all list items and paragraphs
    blocks = soup.find_all(['li', 'p', 'td', 'div'])
    seen = set()
    
    address_pattern = re.compile(r'(Rua|Av\.|Avenida|Travessa)\s+[^\n,]+', re.IGNORECASE)
    phone_pattern = re.compile(r'\(?\d{2}\)?\s*\d{4,5}-?\d{4}')
    
    for block in blocks:
        text = block.get_text(separator=' ', strip=True)
        # Check if it looks like an equipment or address
        if len(text) > 20 and len(text) < 300:
            if address_pattern.search(text) and text not in seen:
                seen.add(text)
                
                # Try to extract a potential name (usually before the address)
                # Or just save the whole text block for manual cleaning
                equipments.append({
                    'source_url': url,
                    'raw_text': text,
                    'possible_phone': phone_pattern.search(text).group(0) if phone_pattern.search(text) else ""
                })
                
    return equipments

def crawl_secretariat(sec_info):
    name = sec_info['name']
    base_url = sec_info['url']
    print(f"\n--- Crawling {name} ({base_url}) ---")
    
    equipments = []
    html = fetch_url(base_url)
    if not html:
        return equipments
        
    soup = BeautifulSoup(html, 'html.parser')
    
    # 1. Search for explicit "Equipamentos" or similar links
    target_links = []
    keywords = ['equipamento', 'escola', 'unidade', 'posto', 'contato', 'endereço']
    
    for link in soup.find_all('a'):
        href = link.get('href')
        text = link.text.lower()
        if href and any(k in text for k in keywords):
            full_url = urllib.parse.urljoin(base_url, href)
            # Avoid external links
            if full_url.startswith(base_url):
                target_links.append(full_url)
                
    # Deduplicate
    target_links = list(set(target_links))
    
    # 2. Extract from homepage itself (often has addresses in footer)
    equipments.extend(extract_address_info(soup, base_url))
    
    # 3. Extract from target links
    for link in target_links:
        time.sleep(1) # be polite
        page_html = fetch_url(link)
        if page_html:
            page_soup = BeautifulSoup(page_html, 'html.parser')
            page_eqs = extract_address_info(page_soup, link)
            equipments.extend(page_eqs)
            
    # Remove duplicates from the same secretariat based on raw_text
    unique_eq = {e['raw_text']: e for e in equipments}.values()
    return list(unique_eq)

def main():
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    main_url = "https://sobral.ce.gov.br/"
    html = fetch_url(main_url)
    if not html:
        print("Failed to fetch main portal")
        return
        
    secretariats = extract_secretariats(html)
    print(f"Found {len(secretariats)} secretariats.")
    
    all_data = {}
    
    # For testing, we can limit to first 3 if needed, but option B means ALL
    for sec in secretariats:
        eqs = crawl_secretariat(sec)
        all_data[sec['name']] = {
            'url': sec['url'],
            'equipamentos_raw': eqs
        }
        
    with open('scripts/scraped_equipamentos.json', 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
        
    print("Scraping completed. Results saved to scripts/scraped_equipamentos.json")

if __name__ == "__main__":
    main()
