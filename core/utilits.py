import ollama
from config import EMB_MODEL
def bulid_promp(query:str,context:list[str])->str:
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



def create_embedding(chunk:str, model:str=EMB_MODEL): # type: ignore
    response = ollama.embed(model=model, input=chunk)
    return {
        "text": chunk,
        "embedding": response["embeddings"][0]
    }