# docker run -d -p 8000:8000 alseambusher/crontab-ui
FROM tryretool/backend
USER root
ENV HOST 0.0.0.0
RUN apt-get update && apt-get install -y gnupg2
RUN gpg -k
RUN gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
RUN echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | tee /etc/apt/sources.list.d/k6.list

RUN apt-get update && apt-get install -y \
      cron \
      wget \
      curl \
      nodejs \
      npm \
      supervisor \
      tzdata \
      k6 \
      golang-go \
&& rm -rf /var/lib/apt/lists/*
ENV   CRON_PATH /var/spool/cron/crontabs
RUN apt-get update && apt-get install -y \
      vim \
&& rm -rf /var/lib/apt/lists/*
RUN   mkdir /crontab-ui; touch $CRON_PATH/root; chmod +x $CRON_PATH/root

WORKDIR /crontab-ui

COPY supervisord.conf /etc/supervisord.conf
COPY . /crontab-ui
RUN   npm install
#RUN   npm install && npm install -g crontab-ui

ENV   CRON_IN_DOCKER true
RUN printenv | grep -v "no_proxy" >> /etc/environment
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
