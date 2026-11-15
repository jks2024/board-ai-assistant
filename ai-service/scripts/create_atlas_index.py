"""MongoDB Atlas 벡터 검색 인덱스 만들기 (Atlas 화면에서 JSON 으로 만들어도 됩니다)

사용법: python scripts/create_atlas_index.py      (.env 의 MONGODB_URI 사용)
인덱스가 Queryable(READY) 상태가 될 때까지 1~2분 걸립니다.
"""
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pymongo import MongoClient                     # noqa: E402
from pymongo.operations import SearchIndexModel     # noqa: E402

from rag.config import get_settings                 # noqa: E402

s = get_settings()
DEFINITION = {
    "fields": [
        {"type": "vector", "path": "embedding", "numDimensions": s.embedding_dimensions, "similarity": "cosine"},
        {"type": "filter", "path": "boardId"},      # pre_filter 로 허용목록 적용
        {"type": "filter", "path": "owner"},
    ]
}

client = MongoClient(s.mongodb_uri)
db = client[s.mongodb_db]
if s.mongodb_collection not in db.list_collection_names():
    db.create_collection(s.mongodb_collection)
col = db[s.mongodb_collection]

names = [i["name"] for i in col.list_search_indexes()]
if s.atlas_index_name in names:
    print(f"이미 있음: {s.atlas_index_name}")
else:
    col.create_search_index(SearchIndexModel(definition=DEFINITION, name=s.atlas_index_name, type="vectorSearch"))
    print(f"생성 요청: {s.atlas_index_name}")

for _ in range(60):
    idx = next((i for i in col.list_search_indexes() if i["name"] == s.atlas_index_name), None)
    if idx and idx.get("queryable"):
        print("Queryable - 사용 가능")
        break
    print("준비 중...", idx.get("status") if idx else "")
    time.sleep(5)
client.close()
