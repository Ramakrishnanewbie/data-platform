## To run Frontend

```
npm run prod
```
Spins up production based server that caches pages as static content to not re-render things dynamically

## Backend 

```
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 10

```

I flinux even best, we can use gunicorn (much more fast)