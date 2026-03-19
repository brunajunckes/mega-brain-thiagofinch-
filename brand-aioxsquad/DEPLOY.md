# Deploy - brand.aioxsquad.ai para alan.hubme.tech

## 🚀 Opções de Deploy

### Opção 1: Docker (Recomendado - Mais simples)

```bash
chmod +x deploy.sh
./deploy.sh docker
```

Isso:
- ✅ Cria imagem Docker com Nginx
- ✅ Inicia container na porta 80
- ✅ Pronto para produção

Para parar:
```bash
docker stop brand-aioxsquad
```

---

### Opção 2: SSH/SCP (Para VPS Linux)

```bash
# Configure as variáveis:
export REMOTE_USER="seu_usuario"
export REMOTE_HOST="alan.hubme.tech"
export REMOTE_PATH="/var/www/html"

chmod +x deploy.sh
./deploy.sh ssh
```

Requer:
- SSH configurado no servidor
- Permissões de escrita em `/var/www/html`
- Nginx/Apache rodando

---

### Opção 3: Manual (Qualquer servidor)

1. Compactar arquivos:
```bash
cd brand-aioxsquad.ai
tar -czf ../site.tar.gz .
```

2. Enviar via FTP/painel de controle:
```
Arquivo: site.tar.gz
Destino: /public_html ou /www
```

3. No servidor, descompactar:
```bash
cd /destino
tar -xzf site.tar.gz
```

---

### Opção 4: Local (Teste/Desenvolvimento)

```bash
chmod +x deploy.sh
./deploy.sh local
```

Abre: `http://localhost:8080`

---

## 📋 Requisitos por Opção

| Opção | Requisitos | Tempo |
|-------|-----------|-------|
| Docker | Docker instalado | ~1 min |
| SSH | SSH access + Linux | ~2 min |
| FTP | Painel FTP | ~5 min |
| Local | Python 3 | ~10s |

---

## 🔧 Customização

### Mudar domínio
No `nginx.conf`:
```nginx
server_name seu-dominio.com;
```

### Adicionar SSL (HTTPS)
Usar Certbot:
```bash
certbot --nginx -d alan.hubme.tech
```

### Cache/Compressão
Já configurado no `nginx.conf`

---

## ✅ Checklist pós-deploy

- [ ] Site acessível em `alan.hubme.tech`
- [ ] Imagens carregam corretamente
- [ ] Links internos funcionam
- [ ] CSS aplicado corretamente
- [ ] Sem erros no console browser

---

## 🆘 Troubleshooting

**"Conexão recusada"**
- Docker: `docker ps` e verificar se container está rodando
- SSH: Verificar credenciais e firewall
- FTP: Verificar endereço e permissões

**"Página não encontrada"**
- Verificar se arquivos foram enviados para o local correto
- Checar permissões de arquivo (755 para pastas, 644 para arquivos)

**"Assets não carregam"**
- Verificar caminhos relativos em HTML
- Nginx config já trata isso com `try_files`

---

## 📞 Próximos passos

1. Escolher opção de deploy (recomendo Docker)
2. Executar `./deploy.sh [opção]`
3. Acessar `alan.hubme.tech`
4. Fazer customizações conforme necessário

Pronto! 🎉
