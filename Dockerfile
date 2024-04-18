# docker run -d -p 8000:8000 alseambusher/crontab-ui
FROM tryretool/backend
USER root

RUN apt-get update && apt-get install -y \
      cron \
      wget \
      curl \
      nodejs \
      npm \
      supervisor \
      tzdata \
&& rm -rf /var/lib/apt/lists/*
ENV   CRON_PATH /var/spool/cron/crontabs

RUN   mkdir /crontab-ui; touch $CRON_PATH/root; chmod +x $CRON_PATH/root

WORKDIR /crontab-ui

LABEL maintainer "@alseambusher"
LABEL description "Crontab-UI docker"

COPY supervisord.conf /etc/supervisord.conf
COPY . /crontab-ui

RUN   npm install

ENV   HOST 0.0.0.0

ENV   PORT 8000

ENV   CRON_IN_DOCKER true

EXPOSE $PORT

CMD ["supervisord", "-c", "/etc/supervisord.conf"]
