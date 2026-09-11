import ollama
from typing import NamedTuple
import chromadb
from config import EMB_MODEL,OLLAMA_URL
from uuid import uuid4
import re
from langchain_text_splitters import RecursiveCharacterTextSplitter
import pymupdf
def bulid_promp(query:str,context)->str:
    context_string = "\n\n".join(context)  
    prompt= f"""
    با استفاده از متن زیر به سؤال پاسخ بده.

    متن:
    {context_string}
-------------------------------------------------------
    سؤال:

    {query}
-------------------------------------------------------
   
قوانین:

1. پاسخ را بر اساس متن ارائه‌شده تولید کن.
2. اگر پاسخ در متن وجود ندارد، اطلاعاتی را جعل نکن.
3. اگر اطلاعات کافی برای پاسخ وجود ندارد، صریحاً اعلام کن.
4. پاسخ را به زبان فارسی و واضح ارائه کن.
5. تا حد امکان مستقیماً به سؤال پاسخ بده.
6. اطلاعات متن را از خود سؤال کاربر متمایز کن.
7. از دانش عمومی خود فقط زمانی استفاده کن که برای پاسخ لازم باشد
   و با اطلاعات متن تناقض نداشته باشد.
    """
    return prompt


class Embedding(NamedTuple):
    text: str
    embedding: list[float]
    
def create_embedding(chunk:str, model:str=EMB_MODEL,url:str=OLLAMA_URL) -> Embedding:
    client =ollama.Client(url)
    response = client.embed(model=model, input=chunk)
    return Embedding(text=chunk,embedding=response["embeddings"][0])



class ChromaDB:
    def __init__(self, db_path:str,collection_name:str="my_collection") -> None:
        self.path = db_path
        self.collection_name = collection_name
    def connect(self):
        self.client = chromadb.PersistentClient(path=self.path)
        self.collection = self.client.get_or_create_collection(name=self.collection_name)


    def add_embedding(self,embedding:Embedding) -> None:
        self.collection.add(
            ids = [str(uuid4)],
            documents=[embedding.text],
            embeddings=[embedding.embedding]
        )

    def retrieve(self,embedding: Embedding, n_results: int = 5) -> chromadb.QueryResult:
        results = self.collection.query(
            query_embeddings=[embedding.embedding],
            n_results=n_results
        )

        return results





def normalize_persian(text: str) -> str:
    """
    Normalize Persian text before chunking/embedding.

    Args:
        text: Raw Persian text

    Returns:
        Normalized Persian text
    """

    # -----------------------------
    # Arabic characters -> Persian
    # -----------------------------

    replacements = {
        "ي": "ی",
        "ى": "ی",
        "ئ": "ی",
        "ك": "ک",
        "ة": "ه",
        "ۀ": "ه",
        "ؤ": "و",

        # Arabic/Persian digits -> Persian digits
        "٠": "۰",
        "١": "۱",
        "٢": "۲",
        "٣": "۳",
        "٤": "۴",
        "٥": "۵",
        "٦": "۶",
        "٧": "۷",
        "٨": "۸",
        "٩": "۹",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)


    # -----------------------------
    # Remove Arabic diacritics
    # -----------------------------

    text = re.sub(
        r"[\u064B-\u065F\u0670]",
        "",
        text
    )


    # -----------------------------
    # Normalize different spaces
    # -----------------------------

    # NBSP
    text = text.replace("\u00A0", " ")

    # Zero-width non-joiner / نیم‌فاصله
    text = text.replace("\u200C", "\u200C")

    # Remove zero-width characters
    text = re.sub(
        r"[\u200B\u200D\uFEFF]",
        "",
        text
    )


    # -----------------------------
    # Normalize line endings
    # -----------------------------

    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")


    # -----------------------------
    # Remove spaces before punctuation
    # -----------------------------

    text = re.sub(
        r"\s+([،؛؟:,.!])",
        r"\1",
        text
    )


    # -----------------------------
    # Normalize multiple spaces
    # -----------------------------

    text = re.sub(
        r"[ \t]+",
        " ",
        text
    )


    # -----------------------------
    # Normalize multiple newlines
    # -----------------------------

    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text
    )


    # -----------------------------
    # Remove spaces at line edges
    # -----------------------------

    text = "\n".join(
        line.strip()
        for line in text.split("\n")
    )


    return text.strip()





def create_persian_splitter(
    chunk_size: int = 800,
    chunk_overlap: int = 120
) -> RecursiveCharacterTextSplitter:
    return RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,

        separators=[
            "\n\n",   # پاراگراف
            "\n",     # خط
            "؟",      # پایان سؤال فارسی
            "۔",      # نقطه عربی
            ".",      # نقطه
            "!",      # علامت تعجب
            "؛",      # نقطه‌ویرگول
            "،",      # ویرگول
            " ",      # فاصله
            ""
        ],

        length_function=len,

        is_separator_regex=False
    )


class OllamaChat:
    def __init__(self,ollama_url:str) -> None:
        self.ollama_url = ollama_url
    def get_client(self):
        return ollama.Client(self.ollama_url)
    def ask_ollama(self,prompt:str,model:str,context_windows:int=6144):
        client = self.get_client()
        return client.chat(
            model=model,
            messages=[
            {    "role":"user",
                "content":prompt}
            ]
            
        )


def text_extractor_pdf(file: bytes) -> str:
    doc = pymupdf.open(stream=file,filetype="pdf")
    pages = []
    for page in doc:
        text = page.get_text()
        if text:
            pages.append(text)
    return "\n\n".join(pages)

def text_extractor(content: bytes):
    text = content.decode("utf-8")
    return text

