FROM nginxinc/nginx-unprivileged:1.28-alpine

ARG VERSION=dev
ARG COMMIT=local
LABEL org.opencontainers.image.title="smartown" \
      org.opencontainers.image.description="SmarTown: registro de problemas urbanos" \
      org.opencontainers.image.source="https://github.com/ricardohsousa/smartown" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${COMMIT}"

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/ /usr/share/nginx/html/

EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
