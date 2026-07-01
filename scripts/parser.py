import json
import re

def parse_data():
    with open('scripts/scraped_equipamentos.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    equipamentos = []
    
    # Regex to clean up some common patterns
    endereco_re = re.compile(r'Endere[cç]o:?\s*(.*?)(?=\. E-mail|E-mail|CEP|Tel|Contato|$)', re.IGNORECASE)
    
    for sec_name, sec_data in data.items():
        # map sec_name to a small id
        sec_id = sec_name.lower()[:4].strip()
        
        raw_list = sec_data.get('equipamentos_raw', [])
        
        for item in raw_list:
            text = item.get('raw_text', '')
            phone = item.get('possible_phone', '')
            
            # Simple heuristic to extract name:
            # If it starts with "ESCOLA", "CEI", "Centro", "1.", etc.
            # We take the first phrase before "Direção" or "Endereço"
            
            name = "Equipamento Desconhecido"
            if "Direção" in text:
                name = text.split("Direção")[0].strip()
            elif "Endereço:" in text:
                # sometimes name is before address if it's not a generic footer
                parts = text.split("Endereço:")
                if len(parts[0]) > 5 and len(parts[0]) < 80:
                    name = parts[0].strip()
                else:
                    name = f"Unidade {sec_name}"
            else:
                name = text[:50] + "..." if len(text) > 50 else text

            # Clean name (remove numbers like "1. ", "2. ")
            name = re.sub(r'^\d+\.\s*', '', name)
            
            # Extract address
            address = text
            m = endereco_re.search(text)
            if m:
                address = m.group(1).strip()
            elif "Endereço " in text:
                address = text.split("Endereço ")[1].split(". E-mail")[0].strip()
                
            if len(address) > 100:
                address = address[:97] + "..."
                
            # Filter out generic footers that got caught
            if name.lower() == "endereço": continue
            if "mapa do site" in name.lower(): continue
            if len(name) < 5: continue
            if "..." in name and len(name) < 15: continue
            
            # Create a simple ID
            eq_id = f"eq_{len(equipamentos)}_{sec_id}"
            
            equipamentos.append({
                "id": eq_id,
                "secretaria_id": sec_id,
                "nome": name,
                "tipo": "Unidade",
                "endereco": address,
                "telefone": phone if phone else "(88) 0000-0000",
                "horario": "Seg a Sex: 08h às 17h",
                "bairro": "Sobral"
            })
            
    # Deduplicate by name
    seen_names = set()
    unique_eqs = []
    for eq in equipamentos:
        if eq['nome'] not in seen_names and not eq['nome'].startswith('Endereço') and not eq['nome'].startswith('RUA'):
            seen_names.add(eq['nome'])
            unique_eqs.append(eq)
            
    # Generate JS file
    js_content = "/* \n  Dados raspados do site sobral.ce.gov.br\n*/\n\n"
    js_content += "const ScrapedEquipamentos = " + json.dumps(unique_eqs, ensure_ascii=False, indent=2) + ";\n"
    
    with open('js/scraped_data.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print(f"Processed {len(unique_eqs)} unique equipments. Saved to js/scraped_data.js")

if __name__ == "__main__":
    parse_data()
