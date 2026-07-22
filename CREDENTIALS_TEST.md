# Credenciais de Teste — Painel Admin

**Ambiente**: Desenvolvimento/Teste  
**Data**: 2026-07-22  
**Versão**: v2.13.1+

## Tabela de Acesso

| Função | Login | Senha | Departamentos | Permissões |
|--------|-------|-------|---------------|-----------|
| **Diretoria** | `super` | `Diretoria!Joyce2026` | Todos 5 | CRUD + Auditoria + Dashboard consolidada |
| **Coordenadora** | `articulacao` | `Artic!Joyla2026` | 4 (Coworking, Link Lab, Sala Treinamento, Átrio) | CRUD + Auditoria |
| **Assistente** | `assistente` | `Artic!Assist2026` | 4 (Coworking, Link Lab, Sala Treinamento, Átrio) | CRUD (sem auditoria) |
| **Música** | `musica` | `Studio!Silton2026` | 1 (Stúdio de Música) | CRUD próprio departamento |

## Validação de RBAC (v2.13.1)

✅ **Teste realizado**:
- Login com `super` → Vê todos 5 departamentos
- Login com `articulacao` → Vê 4 departamentos (Articulação)
- Login com `assistente` → Vê 4 departamentos (Articulação)
- Login com `musica` → Vê 1 departamento (Stúdio)

## Capacidade Máxima por Departamento

| Departamento | Máximo | Validação |
|---|---|---|
| Coworking | 70 pessoas | ✅ Implementada |
| Link Lab | 120 pessoas | ✅ Implementada |
| Sala Treinamento | 30 pessoas | ✅ Implementada |
| Átrio | 150 pessoas | ✅ Implementada |
| Stúdio de Música | 10 pessoas | ✅ Implementada |

## Notas de Segurança

- ⚠️ **NÃO usar em produção** — senhas são de teste apenas
- ⚠️ **Remover** antes de fazer deploy público
- ✅ Senhas NÃO estão em `.env` ou arquivos de configuração externa
- ✅ Hardcoded apenas para desenvolvimento local
- 🔐 Em produção: Usar autenticação via OAuth2 ou JWT

## Como Testar

1. Abrir aplicação: `/Users/sergioponte/AGENDA CRIATIVA/index.html`
2. Clicar em "Admin"
3. Selecionar papel desejado
4. Digitar senha conforme tabela acima
5. Clicar "Entrar"
6. Validar que apenas departamentos autorizados aparecem

## Histórico

- **2026-07-22**: Criado com senhas v2.13.1
- **2026-07-22**: RBAC fix validado com todas as 4 funções
