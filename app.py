import eel
import json
import glob
import os
import csv
import base64
import datetime

file_datas_json = "data\\file_datas.json"

def get_entire_data_csv_path(data_type):
    return f"data\\entire_{data_type}.csv"
# class Image_File:
#     def __init__(self, tags=[], date="0000-00-00", comment="コメント"):
#         self.tags = tags
#         self.date = date
#         self.comment = comment

def main():
    # reset_file_datas_json()
    update_entire_datas()
    eel.init("web")
    eel.start("index.html", size=(1024, 1024), port=8000)


#データ形式周りの操作
def get_file_data_dict(path):
    return {"name":get_file_name_from_path(path), "tag":[], "date":str(datetime.date.today()), "comment":"", "url":[]}
def get_available_file_types():
    return ["image"] #, "audio",  "text", "video"
def get_file_name_from_path(path):
    return path.split("\\")[-1]

#dataフォルダの操作
def reset_file_datas_json():
    result = {"image":{}}
    files = glob.glob("web\\files\\image\\*")
    #jsonの形のdictを作る
    result["image"] = {n[4:]:get_file_data_dict(n) for n in files}
    save_file_datas(result)
    update_entire_datas()
def get_file_datas():
    with open(file_datas_json, encoding="utf-8") as f:
        return json.load(f)
def save_file_datas(file_datas_dict):
    with open(file_datas_json, "w", encoding="utf-8") as f:
        json.dump(file_datas_dict, f, indent=4, ensure_ascii=False)
    #print("file_dataを保存しました file_datas_dict=" + str(file_datas_dict))
def add_file_datas_to_file_datas_json(file_datas):
    #file_datas=[[file_type, file_path],,,]
    datas = get_file_datas()
    for file_data in file_datas:
        if not file_data[1] in datas[file_data[0]]:
            datas[file_data[0]][file_data[1]] = get_file_data_dict(file_data[1])
    save_file_datas(datas)

def save_entire_data(entire_data, data_type):
    with open(get_entire_data_csv_path(data_type), "w", encoding="utf-8") as f:
        csv.writer(f).writerow(entire_data)
    #print("tagsを保存しました entire_tags=" + str(entire_tags))
def add_entire_data(data, data_type):
    save_entire_data(list(set(get_entire_data(data_type) + data)), data_type)
def update_entire_data(data_type):
    entire_data = []
    file_datas = get_file_datas()
    for image in file_datas["image"].values():
        entire_data = list(set(entire_data + image[data_type]))
    save_entire_data(entire_data, data_type)
    print(f"entire_{data_type}を更新しました")
    return entire_data
def update_entire_datas():
    update_entire_data("tag")
    update_entire_data("url")
def get_comment(path):
    data = get_file_datas()
    ans = data["image"][path]["comment"]
    print(ans)
    return ans

#ファイル周りの操作
def get_file_type(file_type_list):
    if file_type_list[0] in get_available_file_types():
        return file_type_list[0]
    else:
        return None
def get_file_path_from_file_name(file_type, file_name):
    return f"files\\{file_type}\\{file_name}"


#javascriptから呼ぶ関数
@eel.expose
def get_file_pathes(file_type):
    datas = get_file_datas()
    #print(list(datas[file_type].keys()))
    return list(datas[file_type].keys())
@eel.expose
def sort_file_pathes(pathes, file_type="image", sort_by="date", reverse=False):
    datas = get_file_datas()
    # print(datas[file_type][pathes[0]])
    ans = sorted(pathes, key=lambda p: datas[file_type][p][sort_by])
    if not reverse:
        ans.reverse()
    print(f"sort_by={sort_by}, reverse={reverse}")
    return ans

@eel.expose
def add_datas_to_images(pathes=[], data_type="", datas_to_add=[]):
    datas = get_file_datas()
    print(f"test {datas_to_add}")
    for path in pathes:
        datas["image"][path][data_type] = list(set(datas["image"][path][data_type] + datas_to_add))
    save_file_datas(datas)
    add_entire_data(datas_to_add, data_type)

@eel.expose
def delete_datas_of_selected_images(selected_images, data_type, datas_for_delete):
    file_datas = get_file_datas()
    for path in selected_images:
        for data in datas_for_delete:
            file_datas["image"][path][data_type].remove(data)
    save_file_datas(file_datas)
    print(f"{selected_images}から{datas_for_delete}を削除しました")
    new_entire_tags = update_entire_data(data_type)
    return new_entire_tags


@eel.expose
def search_file_datas_by_tags(all_tags, sort_by="date", reverse=True): 
    ans = []
    if all_tags == None:
        ans = get_file_pathes("image")
    else:
        not_tags = set()
        tags = set()
        for tag in all_tags:
            if tag[0] == "-" and len(tag) >= 2:
                not_tags.add(tag[1:])
            else:
                tags.add(tag)
        file_datas = get_file_datas()
        for path in file_datas["image"]:
            tag_set_of_path = set(file_datas["image"][path]["tag"])
            #and検索
            if tags <= tag_set_of_path: #tagsを含む
                if not_tags.isdisjoint(tag_set_of_path): #not_tagsと互いに素
                    ans.append(path)
            # #or検索
            # if len(set(file_datas["image"][path]["tag"]) & set(tags)) != 0:
            #     ans.append(path)
    ans = sort_file_pathes(ans, sort_by=sort_by, reverse=reverse)
    return ans

@eel.expose
def save_file(file_type_and_base64, file_name):
    if file_type_and_base64[0] == None:
        print("file_type=None")
        return "FileTypeIsNone"
    data_list = [file_type_and_base64[0], get_file_path_from_file_name(file_type_and_base64[0], file_name)]
    #ファイル名の重複確認をして、重複していれば
    #ファイルを保存
    print(f"{data_list[1]}を保存します")
    add_file_datas_to_file_datas_json([data_list])
    with open("web\\"+data_list[1], mode="wb") as f:
        bytes = base64.b64decode(file_type_and_base64[1])
        f.write(bytes)
    print(f"{data_list[1]}を保存しました")
    return "Success"

@eel.expose
def is_file_in_file_datas_json(file_type, file_name):
    key = get_file_path_from_file_name(file_type, file_name)
    ans = key in get_file_datas()[file_type]
    print(ans)
    return ans

@eel.expose
def delete_file_datas_from_file_datas_json(file_pathes):
    data = get_file_datas()
    for file_path in file_pathes:
        data["image"].pop(file_path)
        os.remove(f"web\\{file_path}")
    save_file_datas(data)
    update_entire_datas()
    print(f"{file_pathes}を削除しました")

@eel.expose
def get_entire_data(data_type):
    with open(get_entire_data_csv_path(data_type), encoding="utf-8") as f:
        datas = [r for r in csv.reader(f)]
        ans = datas[0] if len(datas)!=0 else []
        # print(ans)
        return ans
@eel.expose
def get_image_data(path):
    return get_file_datas()["image"][path]

@eel.expose
def save_comment(path, comment):
    datas = get_file_datas()
    datas["image"][path]["comment"] = comment
    save_file_datas(datas)

@eel.expose
def get_datas_of_selected_images(selected_images, data_type):
    if len(selected_images) == 0:
        return []
    ans = get_entire_data(data_type)
    file_datas = get_file_datas()
    for path in selected_images:
        print(ans)
        ans = list(set(ans) & set(file_datas["image"][path][data_type]))
    print(f"{selected_images}の共通のtag = {ans}")
    return ans


if __name__ == "__main__":
    main()