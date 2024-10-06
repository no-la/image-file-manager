//prototype
String.prototype.to_list = function(func_warn=function(hoge){}){
    //区切り文字でリストにする
    if (this.length == 0){
        func_warn("文字を入力してください");
        return [];
    }else if (this.match(/^([、,\n\s]+)/)){
        func_warn("区切り文字以外の単語を入力してください");
        return [];
    }
    else{
        func_warn("");
        return this.replace(/[、,\n\s]+/g, " ").replace(/[、,\n\s]+$/, "").split(" ");
    }
}

var Image_ = {
    is_selecting_images: false,
    selecting_images: [],
    set_is_selecting_images: function(bool){
        this.is_selecting_images = bool;
        if (!this.is_selecting_images){
            document.getElementById("select_mode_button").innerHTML = "画像選択";
            this.init_selecting_images();
        }else{
            document.getElementById("select_mode_button").innerHTML = "選択解除";
        }
    },
    change_is_selecting_images: function(){
        this.set_is_selecting_images(!this.is_selecting_images);
    },
    change_state_display: function(target, is_selected){
        if (target == null){return;}
        target.style.filter = `brightness(${is_selected? 0.7 : 1})`;
    },
    set_display_selecting_images_num: function(){
        console.log(`selecting_images=${this.selecting_images}`);
        document.getElementById("display_selecting_images_num").innerHTML = `(${this.selecting_images.length}件を選択中)`;
    },
    add_image_id_to_selecting_images: function(image_element){
        if (this.selecting_images.includes(image_element.id)){
            console.log(`${image_element.id}は既に選択しています`);
            return;
        }else{
            this.selecting_images.push(image_element.id);
            this.change_state_display(image_element, true);
        }
    },
    remove_image_id_from_selecting_images: function(image_element){
        this.selecting_images.splice(this.selecting_images.indexOf(image_element.id), 1)
        this.change_state_display(image_element, false);
        this.update_global_nav_container();
    },
    init_selecting_images: function(){
        for (let id of this.selecting_images){
            this.change_state_display(document.getElementById(id), false);
        }
        this.selecting_images.splice(0);
        this.update_global_nav_container();
    },
    update_global_nav_container: function(){
        Image_.set_display_selecting_images_num();
        Tag_list.set_data_list(this.selecting_images);
        Url_list.set_data_list(this.selecting_images);
    },
    get_new_img_element: function(path, id){
        let img_element = document.createElement("img");
        img_element.src = path;
        img_element.id = id;
        img_element.className = "image-file";
        img_element.loading = "lazy";
        //イベント->クリックしたら拡大 画像選択中ならリストに追加
        img_element.addEventListener("click", (e)=>{
            if (this.is_selecting_images){
                //選択or選択解除
                let is_selected = !this.selecting_images.includes(e.target.id);
                if (is_selected){
                    if (e.altKey){
                    }else if (e.ctrlKey){
                        this.add_image_id_to_selecting_images(e.target);
                    }else if (e.shiftKey && this.selecting_images.length > 0){
                        const section_adding = [this.selecting_images.slice(-1)[0], e.target.id];
                        const display_image_area_children = document.getElementById("display_image_area").children;
                        let permit_adding = false;
                        for (let image of display_image_area_children){
                            if (section_adding.includes(image.id)){
                                permit_adding = !permit_adding;
                                if (permit_adding == false) break;
                            }else if (permit_adding == true){
                                this.add_image_id_to_selecting_images(image);
                            }else continue;
                        }
                        this.add_image_id_to_selecting_images(e.target);
                    }else{
                        this.init_selecting_images();
                        this.add_image_id_to_selecting_images(e.target);
                    }
                }else{
                    this.remove_image_id_from_selecting_images(e.target)
                }
                console.log(this.selecting_images);
                this.update_global_nav_container();
            }else{
                document.getElementById("zoom_area").style.display = "flex";
                Zoom_Image.set_zoom_image(e.target.id);
            }
        })
        return img_element;
    },
    add_images: function(pathes, ids=[], append=true){
        const image_area = document.getElementById("display_image_area");
        if (ids.length == 0){
            ids = pathes;
        }else if(ids.length < pathes.length){
            console.error(`idsとpathesの要素数が一致しません ids=${ids}, pathes=${pathes}`);
            return;
        }
        let ans = [];
        //image_areaに画像をセットする
        for (let i=0; i<pathes.length; i++){
            const image = this.get_new_img_element(pathes[i], ids[i])
            if (append){
                image_area.appendChild(image);
            }else{
                image_area.prepend(image);
            }
            ans.push(image);
        }
        return ans;
    },
    set_images: function(pathes){
        document.getElementById("display_image_area").innerHTML = ""
        this.add_images(pathes);
        this.set_is_selecting_images(false);
    },
    delete_selecting_images: function(){
        eel.delete_file_datas_from_file_datas_json(this.selecting_images);
        for (let id of this.selecting_images){
            document.getElementById(id).remove();
        }
        this.selecting_images.splice(0);
        this.update_global_nav_container();
    },
    init_images: async function(){
        const pathes = await eel.search_file_datas_by_tags(null, Sort.get_sort_by(), Sort.get_is_down())();
        this.set_images(pathes);
    },
    judge_is_file_type_available: function(file_type){
        return ["image"].includes(file_type); //, "audio", "text", "video" いったんimageのみで
    },
    get_file_path_from_file_name: function(file_type, file_name){
        return `files\\${file_type}\\${file_name}`;
    },
    get_displaying_image_pathes: function(){
        const display_image_area_children = document.getElementById("display_image_area").children;
        let ans = [];
        for (let child of display_image_area_children){
            ans.push(child.id);
        }
        return ans;
    },
    open_confirm_delete_area: function(){
        const display_selecting_image_area = document.getElementById("display_selecting_image_area");
        document.getElementById("confirm_delete_area").style.display = "flex";
        display_selecting_image_area.innerHTML = "";
        for (let path of this.selecting_images){
            display_selecting_image_area.innerHTML += `<img class="selecting_image" src="${path}">`;
        }
    },
    set_image_size: function(size="200"){
        console.log(`size=${size}`);
        for (let rule of document.styleSheets[0].cssRules){
            if (rule.selectorText == ".image-file"){
                console.log("find");
                rule.style.height = size + "px";
                break;
            }
        }
    }
};
var Zoom_Image = {
    set_zoom_image: function(id){
        const zoom_img = document.getElementById("zoom_img");
        zoom_img.setAttribute("src", id);
        zoom_img.setAttribute("alt", id); //idは変えられないのでaltに持たせる
        this.set_display_data(id);
    },
    exit_zoom_area: function(){
        document.getElementById("zoom_area").style.display = "none";
    },
    get_zooming_image_id: function(){
        return document.getElementById("zoom_img").alt;
    },
    to_next_image: function(to_next){
        const target = to_next? 
            document.getElementById(this.get_zooming_image_id()).nextElementSibling
            :
            document.getElementById(this.get_zooming_image_id()).previousElementSibling
        if (target == null){
            console.warn("targetがnullなので処理を中断します");
            return;
        }
        this.set_zoom_image(target.id);
    },
    set_display_data: async function(path){
        const data = await eel.get_image_data(path)();
        //コメント
        const comment_textarea = document.getElementById("comment_textarea");
        comment_textarea.value = data["comment"];
        // console.log(`comment=${data["comment"];}`);

        //タグ
        const tag_list = document.getElementById("display_tag_list");
        tag_list.innerHTML = "";
        for (t of data["tag"]){
            const content = Tag_list.get_tag_content_html(t);
            let html_add = document.createElement("label");
            html_add.htmlFor = `display${t}`
            html_add.innerHTML = content;
            html_add.addEventListener("click", (e)=>{
                const htmlFor = (e.target.tagName == "LABEL")? e.target.htmlFor: e.target.parentElement.htmlFor;
                if (!e.ctrlKey){
                    e.preventDefault();
                    this.exit_zoom_area();
                    Search.search_with(htmlFor.slice(7));
                }
            })
            tag_list.appendChild(html_add);
        }
        //URL
        const url_list = document.getElementById("display_url_list");
        url_list.innerHTML = "";
        let index = 1;
        for (u of data["url"]){
            const content = Url_list.get_url_content_html(u, index);
            let html_add = `<label>${content}　</label>`;
            url_list.insertAdjacentHTML("beforeend", html_add);
            index++;
        }
        
        //ファイル名
        const file_name_area = document.getElementById("display_file_name_area");
        file_name_area.innerHTML = data["name"];

        //日付
        const date_area = document.getElementById("display_date_area");
        date_area.innerHTML = data["date"];
    },
    set_comment: async function(path){
        const comment_textarea = document.getElementById("comment_textarea");
        // const comment = await eel.get_comment(path)();
        comment_textarea.value = comment;
        console.log(`comment=${comment}`);
    },
    save_comment: function(){
        const comment = document.getElementById("comment_textarea").value;
        eel.save_comment(this.get_zooming_image_id(), comment);
    },
    set_display_tag_list: async function(){
        const tag_list = document.getElementById("display_tag_list");
        const tags_for_display = await eel.get_datas_of_selected_images([this.get_zooming_image_id()], "tag")();
        tag_list.innerHTML = "";
        for (t of tags_for_display){
            let html_add = `<label>${t}　</label>`;
            tag_list.insertAdjacentHTML("beforeend", html_add);
        }
    }
};
var Search = {
    get_search_words_without_remove_words: function(){
        search_tags = document.getElementById("input_search_text").value.to_list(console.warn);
        for (let i=0; i<search_tags.length; i++){
            if (search_tags[i].match(/^-/)){
                search_tags.splice(i, 1);
                i--;
            }
        }
        return search_tags;
    },
    display_images_searched: async function(){
        const search_tags = document.getElementById("input_search_text").value.to_list();
        const search_result = await eel.search_file_datas_by_tags(search_tags, Sort.get_sort_by(), Sort.get_is_down())();
        Image_.set_is_selecting_images(false);
        Image_.set_images(search_result);
        document.getElementById("select_mode_button").innerHTML = "画像選択";
    },
    search_with: function(tag){
        document.getElementById("input_search_text").value = tag;
        this.display_images_searched();
    }
};
var Sort = {
    get_is_down: function(){
        return document.getElementById("sort_direction").value == "down";
    },
    get_sort_by: function(){
        return document.getElementById("sort_select").value;
    }
};
var Url = {
    get_twitter_account_url_html: function(twitter_id){
        const url = `https://twitter.com/${twitter_id.substr(2)}`;
        return `<a href="${url}" target="_blank">${twitter_id}</a>`;
    },
    judge_is_twitter_id: function(text){
        return text.match(/^t@/);
    },
    get_is_twitter_link_and_id: function(text){
        let ans = [text.match(/^https:\/\/[x,twitter].com/)]
        if (ans[0]){
            ans.push("t@"+text.split("/")[3])
        }
        return ans
    }
};
class Data_List{ //tagは<lable>要素.htmlForで管理する
    constructor(data_type){
        this.data_type = data_type;
        this.data_list = document.getElementById(`${this.data_type}_list`);
        this.input_data = document.getElementById(`input_${this.data_type}`)
    }
    add_datas_to_input_data(datas){
        this.input_data.value = datas.join(" ")
    }
    async set_data_list(selecting_images=[]){
        const datas_for_display = await eel.get_datas_of_selected_images(selecting_images, this.data_type)();
        console.log(datas_for_display);
        this.data_list.innerHTML = "";
        this.add_datas_to_data_list(datas_for_display);
    }
    add_datas_to_data_list(datas_for_display){
        for (let d of datas_for_display){
            let permit_adding = true;
            for (let elem of this.data_list.children){
                if (elem.htmlFor == d){
                    permit_adding = false;
                    break;
                }
            }
            if (permit_adding){
                let html_add = this.get_html_add(d);
                this.data_list.appendChild(html_add);
            }
        }
    }
    get_html_add(data){
        //オーバーライドする
    }
    delete_datas_from_data_list(datas_for_delete){
        const data_list_children = [...this.data_list.children];
        for (let i=0; i<data_list_children.length; i++){
            console.log(`${i}, ${data_list_children[i].htmlFor}`);
            if (datas_for_delete.includes(data_list_children[i].htmlFor)){
                data_list_children[i].remove();
            }
        }
        console.log(`${this.data_type}_listから${datas_for_delete}を削除しました`);
    }
    get_selected_datas_for_delete(){
        const data_list_children = this.data_list.children;
        var checked_datas = [];
        for (let i=0; i<data_list_children.length; i++){
            if (data_list_children[i].firstElementChild.checked){
                checked_datas.push(data_list_children[i].htmlFor);
            }
        }
        return checked_datas;
    }
    get_datas_to_add(){
        const input_data_value = document.getElementById(`input_${this.data_type}`).value;
        // console.log(input_data_value.to_list());
        return input_data_value.to_list(this.warn_at_input_data);
    }
    init_input_data(){
        document.getElementById(`input_${this.data_type}`).value = "";
        console.log("input_tagを初期化しました");
    }
    warn_at_input_data(warning_text){
        //オーバーライドする
    }
    send_datas(datas_to_add, callback=()=>{}){
        if (datas_to_add == null){return;}
        console.log(`${this.data_type}_to_add=${datas_to_add}`);
        eel.add_datas_to_images(Image_.selecting_images, this.data_type, datas_to_add)();
        this.add_datas_to_data_list(datas_to_add)
        this.init_input_data();
        callback(datas_to_add);
    }
    send_input_datas(callback=()=>{}){
        const datas_to_add = this.get_datas_to_add();
        this.send_datas(datas_to_add, callback);
    }
    async delete_datas(callback=(x)=>{}){
        const datas_to_delete = this.get_selected_datas_for_delete();
        this.delete_datas_from_data_list(datas_to_delete);
        const entire_datas = await eel.delete_datas_of_selected_images(Image_.selecting_images, this.data_type, datas_to_delete)();
        callback(entire_datas);
    }
}
class Tag_List extends Data_List{
    constructor(){
        super("tag");
    }
    get_html_add(data){
        const content = this.get_tag_content_html(data);
        let html_add = document.createElement("label");
        html_add.htmlFor = data;
        html_add.innerHTML =  `<input type="checkbox" id="${data}" name="${data}">${content}`;
        html_add.addEventListener("contextmenu", (e)=>{
            const htmlFor = (e.target.tagName == "LABEL")? e.target.htmlFor: e.target.parentElement.htmlFor;
            e.preventDefault();
            Search.search_with(htmlFor);
        })
        return html_add;
    }
    warn_at_input_data(warning_text){
        document.getElementById("warning_text").innerHTML = warning_text;
    }
    get_tag_content_html(tag){
        const ans = Url.judge_is_twitter_id(tag)? Url.get_twitter_account_url_html(tag) : tag;
        return ans
    }
    async init_entire_tags_datalist(){
        const entire_tags = await eel.get_entire_data("tag")();
        this.set_entire_tags_datalist(entire_tags);
    }
    set_entire_tags_datalist(entire_tags){
        document.getElementById("entire_tags_datalist").innerHTML = "";
        this.add_tags_to_entire_tags_datalist(entire_tags);
    }
    add_tags_to_entire_tags_datalist(tags){
        const datalist = document.getElementById("entire_tags_datalist");
        for (let tag of tags){
            let permit_adding = true;
            for (let option of datalist.children){
                if (tag == option.value){
                    permit_adding = false;
                    break;
                }
            }
            if (permit_adding){
                datalist.innerHTML += `<option value="${tag}">`;
            }
        }
    }
    send_datas(datas_to_add){
        super.send_datas(datas_to_add, this.add_tags_to_entire_tags_datalist);
    }
    send_input_datas(){
        super.send_input_datas(this.add_tags_to_entire_tags_datalist);
    }
    async delete_datas(){
        super.delete_datas(this.set_entire_tags_datalist);
    }
}
class Url_List extends Data_List{
    constructor(){
        super("url");
    }
    get_html_add(data){
        const content = this.get_url_content_html(data, this.data_list.children.length+1);
        let html_add = document.createElement("label");
        html_add.htmlFor = data;
        html_add.innerHTML = `<input type="checkbox" id="${data}" name="${data}">${content}`;
        return html_add;
    }
    get_url_content_html(url, index){
        const ans = `<a href="${url}" target="_blank">リンク${index}</a>`;
        return ans;
    }
    get_datas_to_add(){
        let datas = super.get_datas_to_add();
        let add_to_tag_list = []
        for (let i=0;i<datas.length;i++){
            let temp = Url.get_is_twitter_link_and_id(datas[i])
            if (temp[0]){
                add_to_tag_list.push(temp[1])
            }
        }
        Tag_list.add_datas_to_input_data(add_to_tag_list)
        return datas
    }
}
var Tag_list, Url_list;


function load(){
    Tag_list = new Tag_List();
    Url_list = new Url_List();

    //イベントをセットする
    document.getElementById("zoom_area").addEventListener("click", (e)=>{
        if (e.target.id == "zoom_area"){
            Zoom_Image.exit_zoom_area();    
        }
    });
    document.getElementById("image_area").addEventListener("dragover", (e)=>{
        e.preventDefault();
        console.log("dragover");
    });
    document.getElementById("image_area").addEventListener("drop", async (e)=>{
        e.preventDefault();
        console.log(`drop ${e.dataTransfer.items[0].kind}`);
        const files = e.dataTransfer.files;
        if (files.length != 0){
            Image_.set_is_selecting_images(false);
            Image_.set_is_selecting_images(true);
            let recieved_file = false;
            for (let i=0; i<files.length; i++){
                //fileを受け付けるか判定する
                const file_type = files[i].type.split("/")[0];
                if (!Image_.judge_is_file_type_available(file_type)){
                    console.warn(`対応していないファイル形式です file_type=${files[i].type}`);
                    continue;
                }else if (await eel.is_file_in_file_datas_json(file_type, files[i].name)()){
                    window.alert(`${files[i].name}は既に存在します`);
                    continue;
                }else{
                    console.log(`ファイルを受け取りました file_name=${files[i].name} file_type=${files[i].type}`);
                    recieved_file = true;
                    //console.log(`relativePath=${files[i].webkitRelativePath}, name=${files[i].name}`);
                    const reader = new FileReader();
                    reader.onload = async function (e) {
                        const data = e.target.result;
                        let data_list = data.split(",");
                        data_list[0] = file_type;
                        const id = Image_.get_file_path_from_file_name(file_type, files[i].name);
                        const images = Image_.add_images([data], [id], append=false); //srcはdata、idはfiles[i].name
                        // images[0].scrollIntoView(false, option="instant");
                        Image_.add_image_id_to_selecting_images(images[0]);
                        let ans = await eel.save_file(data_list, files[i].name);
                        Tag_list.send_datas(Search.get_search_words_without_remove_words());
                        Image_.update_global_nav_container();
                    }
                    reader.readAsDataURL(files[i]);
                }
            }
        }else{
            //文字列を受け取る 文字列を複数個同時に受け取ることってないよね...？
            e.dataTransfer.items[0].getAsString((x)=>{console.log(`stringを受け取りました value=${x}`)})
        }
    });
    document.getElementById("send_search_button").addEventListener("click", ()=>Search.display_images_searched());
    document.getElementById("select_mode_button").addEventListener("click", (e)=>Image_.change_is_selecting_images(e));
    document.getElementById("sort_select").addEventListener("change", async (e)=>{
        let sorted_pathes = await eel.sort_file_pathes(Image_.get_displaying_image_pathes(), "image", Sort.get_sort_by(), Sort.get_is_down())();
        Image_.set_images(sorted_pathes);
    })
    document.getElementById("sort_direction").addEventListener("change", async (e)=>{
        let sorted_pathes = await eel.sort_file_pathes(Image_.get_displaying_image_pathes(),"image", Sort.get_sort_by(), Sort.get_is_down())();
        Image_.set_images(sorted_pathes);
    })
    document.getElementById("send_tag_button").addEventListener("click", ()=>{
        Tag_list.send_input_datas();
    })
    document.getElementById("delete_tag_button").addEventListener("click", ()=>{
        Tag_list.delete_datas();
    })
    document.getElementById("send_url_button").addEventListener("click", ()=>{
        Url_list.send_input_datas();
    })
    document.getElementById("delete_url_button").addEventListener("click", ()=>{
        Url_list.delete_datas();
    })
    document.getElementById("zoom_area_left_edge").addEventListener("click", ()=>Zoom_Image.to_next_image(false));
    document.getElementById("zoom_area_right_edge").addEventListener("click", ()=>Zoom_Image.to_next_image(true));
    document.getElementById("delete_button").addEventListener("click", ()=>{
        if (!Image_.is_selecting_images){
            console.log("画像を選択していません");
            return;
        }else{
            Image_.open_confirm_delete_area();
        }
    });
    document.getElementById("confirm_ok_button").addEventListener("click", ()=>{
        Image_.delete_selecting_images();
        document.getElementById("confirm_delete_area").style.display = "none";
    });
    document.getElementById("confirm_cancel_button").addEventListener("click", ()=>{
        document.getElementById("confirm_delete_area").style.display = "none";
    });
    document.getElementById("image_size_slider").addEventListener("change", (e)=>Image_.set_image_size(e.target.value));
    document.getElementById("comment_textarea").addEventListener("change", (e)=>Zoom_Image.save_comment(e.target.innerHTML));


    Image_.init_images();
    Tag_list.init_entire_tags_datalist();
}


window.onload = load;