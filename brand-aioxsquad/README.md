# 🎨 AIOX Design System - Brand Clone

Clone completo de https://brand.aioxsquad.ai/ com deploy automático pronto para produção.

## 📦 O que está incluído

```
brand-aioxsquad/
├── brand.aioxsquad.ai/     (111 arquivos, site completo)
├── Dockerfile              (imagem Docker otimizada)
├── nginx.conf              (configuração de servidor web)
├── deploy.sh               (script automático)
├── DEPLOY-QUICK.md         (instruções rápidas) ← COMECE AQUI
└── DEPLOY.md               (guia completo)
```

## 🚀 Deploy em 3 linhas

```bash
docker build -t brand-aioxsquad:latest .
docker run -d --name brand-aioxsquad -p 80:80 brand-aioxsquad:latest
# Pronto! Acesse http://alan.hubme.tech
```

## 📊 Especificações

| Item | Detalhes |
|------|----------|
| **Arquivos** | 111 (HTML, CSS, JS, imagens, fontes) |
| **Tamanho** | 6.5 MB |
| **Server** | Nginx Alpine (otimizado) |
| **Docker Image** | 102 MB (leve) |
| **Cache** | Configurado (1 ano para assets) |
| **Compression** | Gzip ativado |
| **HTTPS** | Suporta (use Certbot) |

## 🎯 Próximos passos

1. **Fazer upload** do pacote para alan.hubme.tech
2. **Executar** os 3 comandos de deploy acima
3. **Acessar** http://alan.hubme.tech
4. **Customizar** conforme necessário

## 📖 Documentação

- `DEPLOY-QUICK.md` - Guia rápido (recomendado)
- `DEPLOY.md` - Guia completo com todas as opções
- `nginx.conf` - Configurações do servidor

## 🔧 Customização

Editar `nginx.conf` para:
- Mudar domínio
- Adicionar headers customizados
- Modificar cache rules
- Adicionar SSL/HTTPS

## ✅ Status

- ✅ Site clonado completamente
- ✅ Dockerfile criado
- ✅ Nginx configurado
- ✅ Pronto para produção
- ✅ Sem dependências externas

## 🆘 Problemas?

**Docker não encontrado:**
```bash
curl -fsSL https://get.docker.com | sh
```

**Porta 80 em uso:**
```bash
docker run -d --name brand-aioxsquad -p 8080:80 brand-aioxsquad:latest
# Acesse em http://alan.hubme.tech:8080
```

---

**Deploy feito com ❤️**
