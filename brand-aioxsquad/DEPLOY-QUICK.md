# 🚀 Deploy Rápido - brand.aioxsquad para alan.hubme.tech

## Para fazer deploy NO SEU SERVIDOR:

### 1️⃣ Fazer upload do arquivo
```bash
# Fazer download ou copiar
brand-deploy.tar.gz
```

### 2️⃣ No servidor (alan.hubme.tech), descompactar:
```bash
tar -xzf brand-deploy.tar.gz
cd brand-aioxsquad
```

### 3️⃣ Fazer deploy com Docker
```bash
# Build da imagem
docker build -t brand-aioxsquad:latest .

# Iniciar container (escolher porta livre)
docker run -d \
  --name brand-aioxsquad \
  -p 80:80 \
  --restart=always \
  brand-aioxsquad:latest
```

✅ **Pronto! Site rodando em: http://alan.hubme.tech**

---

## 🛑 Gerenciamento

**Ver logs:**
```bash
docker logs brand-aioxsquad -f
```

**Parar:**
```bash
docker stop brand-aioxsquad
```

**Reiniciar:**
```bash
docker restart brand-aioxsquad
```

**Remover:**
```bash
docker rm brand-aioxsquad
```

---

## 📋 Pré-requisitos no servidor

- [ ] Docker instalado
- [ ] Porta 80 disponível (ou usar outra: `-p 8080:80`)
- [ ] Espaço em disco (~200MB)

---

## 🎯 Resumo

- **Imagem Docker:** ✅ Pronta
- **Configuração Nginx:** ✅ Otimizada
- **Arquivos do site:** ✅ Completos
- **Scripts de deploy:** ✅ Inclusos

Basta fazer upload e executar os 3 passos acima!

**Tempo estimado:** ~2 minutos ⚡
