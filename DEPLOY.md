# Deploy na VPS

Guia para colocar (e manter) o bolão no ar na VPS, com Docker Compose.

## Como fica rodando

```
Internet ──► Caddy (:80/:443, HTTPS automático) ──┬─► /api/*  ──► api (NestJS :3000) ──► db (Postgres)
            imagem com o build do front embutido   └─► resto  ──► arquivos do React (/srv)
```

- **caddy** (`web/Dockerfile`): serve o front, encaminha `/api` para a API e cuida do certificado HTTPS.
- **api** (`api/Dockerfile`): ao iniciar, aplica as migrations pendentes e sobe o Nest.
- **db**: Postgres 18, com os dados no volume `bolao-tga_pgdata`.
- Só o Caddy expõe portas (80/443). API e banco ficam na rede interna do Docker.

## Pré-requisitos (já feitos)

- VPS com Ubuntu, usuário não-root, SSH por chave, `ufw` liberando 22/80/443, Docker instalado.
- Subdomínio do DuckDNS apontando para o IP da VPS.

## 1. Dar acesso ao GitHub para a VPS

Como o repositório é privado, a VPS precisa de uma chave própria, só de leitura (*deploy key*).

Na VPS:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_bolao -N "" -C "vps-bolao"
cat ~/.ssh/github_bolao.pub
```

No GitHub: repositório → **Settings → Deploy keys → Add deploy key**. Cole a chave pública e **deixe "Allow write access" desmarcado**.

Ainda na VPS, faça o Git usar essa chave:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github.com
    IdentityFile ~/.ssh/github_bolao
    IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config
ssh -T git@github.com    # deve responder "Hi ...! You've successfully authenticated"
```

## 2. Desligar o "hello world" do Caddy

A pasta `~/bolao-tga` atual tem só o teste do Caddy. O certificado HTTPS fica no volume
`bolao-tga_caddy_data`, que **não** é apagado aqui e será reaproveitado.

```bash
cd ~/bolao-tga && docker compose down     # sem "-v": mantém o volume do certificado
cd ~ && mv bolao-tga bolao-tga-hello      # guarda a pasta antiga (pode apagar depois)
```

## 3. Clonar o projeto

```bash
git clone git@github.com:SEU_USUARIO/SEU_REPOSITORIO.git ~/bolao-tga
cd ~/bolao-tga
```

> O nome do projeto está fixo no `docker-compose.yml` (`name: bolao-tga`), então os
> volumes (banco e certificado) são sempre os mesmos, qualquer que seja o nome da pasta.

## 4. Configurar o `.env`

```bash
cp .env.example .env
chmod 600 .env
openssl rand -hex 24        # use como POSTGRES_PASSWORD
openssl rand -base64 48     # use como JWT_SECRET
nano .env
```

| Variável | O que colocar |
|---|---|
| `DOMAIN` | Seu subdomínio, ex.: `bolaotga.duckdns.org` |
| `POSTGRES_PASSWORD` | Saída do `openssl rand -hex 24` (só letras e números) |
| `JWT_SECRET` | Saída do `openssl rand -base64 48` |
| `SIGNUP_CODE` | O código de convite que você vai passar para os amigos. Vazio = cadastro fechado |

> Não troque `POSTGRES_PASSWORD` depois que o banco for criado: o Postgres só lê essa
> variável na primeira inicialização do volume.

## 5. Subir tudo

```bash
docker compose up -d --build
```

O primeiro build leva alguns minutos (cerca de 6 numa máquina comum). Depois, acompanhe:

```bash
docker compose ps             # api deve ficar "healthy"
docker compose logs -f api    # deve mostrar as migrations aplicadas e "Nest application successfully started"
```

## 6. Popular o banco (seed) e criar o admin

Rode **uma vez**, trocando o e-mail pelo seu:

```bash
docker compose exec -e ADMIN_EMAIL=voce@exemplo.com api yarn prisma:seed
```

Ele cadastra as 27 categorias com os indicados, define o bloqueio para 10/12 às 21h (Brasília)
e cria o admin. **A senha do admin aparece uma única vez no terminal: guarde na hora.**
Para escolher a senha, acrescente `-e ADMIN_PASSWORD=sua-senha`.

Rodar o seed de novo é seguro: ele não duplica nada, não troca a senha do admin e não mexe
no horário de bloqueio (que você pode alterar pelo painel do admin).

## 7. Testar

1. Abra `https://SEU_DOMINIO` e entre como admin.
2. Crie a sua conta de player pelo link `https://SEU_DOMINIO/cadastro?convite=SEU_CODIGO`.
3. Faça um palpite e veja o progresso no ranking.
4. Mande o link de cadastro para a galera.

## Atualizar depois de mudanças no código

Depois de dar `git push` no seu computador, na VPS:

```bash
cd ~/bolao-tga && sh deploy.sh
```

Ele faz `git pull`, reconstrói as imagens, sobe os containers (as migrations novas são
aplicadas automaticamente) e limpa imagens antigas.

## Backups do banco

Backup manual:

```bash
sh scripts/backup-db.sh       # salva em backups/bolao-AAAAMMDD-HHMMSS.sql.gz
```

Backup automático todo dia às 4h (mantém os 14 mais recentes). Rode `crontab -e` e adicione:

```
0 4 * * * cd /home/SEU_USUARIO/bolao-tga && sh scripts/backup-db.sh >> backups/backup.log 2>&1
```

Restaurar um backup (**substitui os dados atuais**):

```bash
gunzip -c backups/ARQUIVO.sql.gz | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

> Para ter uma cópia fora da VPS, baixe de vez em quando para o seu computador:
> `scp bolao:~/bolao-tga/backups/ARQUIVO.sql.gz .`

## Checklist antes da cerimônia (10/12)

- [ ] Backup manual feito no dia
- [ ] Todo mundo cadastrado e conseguindo entrar
- [ ] Horário de bloqueio conferido no painel do admin (aba **Bloqueio**)
- [ ] Você logado como admin no celular, na aba **Resultados**
- [ ] (Opcional) Fechar o cadastro: esvazie `SIGNUP_CODE` no `.env` e rode `docker compose up -d`

## Comandos úteis

```bash
docker compose ps                          # status dos containers
docker compose logs -f api                 # logs da API (Ctrl+C para sair)
docker compose logs -f caddy               # logs do Caddy (certificado, acessos)
docker compose restart api                 # reinicia só a API
docker compose up -d                       # aplica mudanças no .env
docker compose exec db psql -U bolao bolao # console do banco
docker compose down                        # para tudo (os dados ficam nos volumes)
```

> **Nunca use `docker compose down -v` em produção**: o `-v` apaga os volumes, ou seja,
> o banco inteiro e o certificado.

## Problemas comuns

| Sintoma | Provável causa / solução |
|---|---|
| Site não abre / erro de certificado | `docker compose logs caddy`. Confira se o DuckDNS aponta para o IP da VPS e se as portas 80/443 estão liberadas no `ufw` e no firewall do painel da Hostinger. |
| `502 Bad Gateway` em `/api` | A API não está de pé: `docker compose ps` e `docker compose logs api`. |
| API reiniciando em loop | Veja `docker compose logs api`. Erro de conexão com o banco costuma ser `POSTGRES_PASSWORD` alterado depois de o banco já existir. |
| Cadastro diz "desativado" | `SIGNUP_CODE` está vazio no `.env`. Preencha e rode `docker compose up -d`. |
| Build falha por falta de memória | Confirme que o swap está ativo (`free -h`). |
