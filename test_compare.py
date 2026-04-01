import urllib.parse
from urllib.parse import urlencode

url = "http://localhost:5007/internal/models/compare?" + urlencode({"tenantId": "123", "datasetId": ""})
print(url)
