`npm install`

`npm run build`

`npm run start`

---

send a `POST` request to:

`http://localhost:<PORT>/api/prompt`



request body:

```json
{
    "messages": [
      {
        "role": "system",
        "content": <initial message>
      },
      {
        "role": "user",
        "content": <message>
      }
    ]
}
```

`"role": "system"` message is optional. It will reset current session.