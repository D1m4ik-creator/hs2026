FROM python:3.13-slim

WORKDIR /api

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN pip install --upgrade pip
COPY requirements.txt  .

RUN pip install --no-cache-dir -r requirements.txt
COPY . .

EXPOSE 7000

CMD ["daphne", "-b", "0.0.0.0", "-p", "7000", "api.asgi:application"]
