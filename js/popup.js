const editPage = document.getElementById("editPage");
const saveNewFld = document.getElementById("saveNewFld");
let masterJson = {};
let currOpenUuid = {};

document.addEventListener("DOMContentLoaded", async function () {
    console.log("popup js loaded");

    // test method todo remove this
    // click on edit page
    function myAlertTop(){
        $(".myAlert-top").show();
        setTimeout(function(){
            $(".myAlert-top").hide();
        }, 2000);
    }


    // load the master json
    loadMasterJson(displayExistingFolders);

    $("#newFldInp").keyup(function(event) {
        if (event.keyCode === 13) {
            $("#newFldInpTxt").click();
        }
    });

    // click on open all url
    $("#fldParent").on("click", ".fldItm", function (e) {
        if (e.target.classList.contains('fldEditImg')
            || e.target.classList.contains('fldEdit')
            || e.target.classList.contains('fldAdd')
            || e.target.classList.contains('fldAddImg')) {
            return;
        } else {
            let ud = $(this).attr('uuid');
            console.log('open urls for uuid ' + $(this).attr('uuid'));
            try {
                openTabs(masterJson[ud].urls);
            } catch (e) {
                console.error(e);
            }
        }
    });

    // click on edit page
    $("#fldParent").on("click", ".fldEdit", (e) => {
        let _uuid = $(e.target).parent().closest('.fldItm').attr('uuid');
        console.log('open edit page for uuid' + _uuid);
        openEditPg(_uuid);
    });

    // click on add url to folder
    $("#fldParent").on("click", ".fldAdd", async (e) => {
        let _uuid = $(e.target).parent().closest('.fldItm').attr('uuid');
        console.log('add url to following folder uuid:' + _uuid);
        let _tab = await getCurrentPage();
        let _url = _tab.url;
        console.log(_tab);
        console.log(_url);
        addUrlToFldInMJ(_uuid, _url);
        saveMJ();
        displayExistingFolders();
    });

    $("#backArrowDiv").on("click", () => {
        closeEditPg();
    });

    // click delete url
    $("#editPageUrlList").on("click", ".editInpDel", function (e) {
        console.log('cancel clicked');
        let _uuid = $(e.target).parent().closest('.editInpGroup').attr('uuid');
        $(e.target).parent().closest('.editInpGroup').css('display', 'none');
        let _url = $(e.target).parent().closest('.editInpGroup').children('.editInp').val();
        delUrlFrmFldInMJ(_uuid, _url);
    });

    $("#saveFldBtn").on("click", function () {
        console.log('save on edit page button clicked');
        let _name = $("#editFldInp").val();
        changeFldName(currOpenUuid, _name);
        saveMJ();
        closeEditPg();
    });

    $("#delFldDiv").on("click", function () {
        console.log('delete folder clicked');
        showModal();
        showOverlay();
    });

    $('#CMOkBtn').on('click', function (){
        hideModal();
        hideOverlay();
        if (currOpenUuid) {
            delete masterJson[currOpenUuid];
            saveMJ();
            closeEditPg();
        } else {
            //todo show err
        }
    })

    $('.cancelModal').on('click', function (){
        hideModal();
        hideOverlay();
    })

    // click on acc fldItm
    $("#accExistingFldHld").on("click", ".accExistingFld", async (e) => {
        let _uuid = $(e.target).attr('uuid');
        console.log('add this page to folder with uuid ' + _uuid);

        let _tab = await getCurrentPage();
        let _url = _tab.url;
        console.log(_tab);
        console.log(_url);
        addUrlToFldInMJ(_uuid, _url);
        saveMJ();
    });

    $("#newFldInpTxt").on('click', async () => {
        let _name = $('#newFldInp').val();
        if (_name) {
            let _uuid = createNewFLd(_name);
            let _tab = await getCurrentPage();
            let _url = _tab.url;
            addUrlToFldInMJ(_uuid, _url);
            displayExistingFolders();
            saveMJ();
            $("#newFldInp").val('');
        } else {
            console.error('you should add a name to continue');
        }
    });
});

function showAlert(msg) {
    if(msg) {
        $('#alertBox').text(msg);
    } else {
        $('#alertBox').text('Success');
    }
}

function createNewFLd(_name) {
    let uuid = getUuid();
    masterJson[uuid] = {
        name: _name,
        urls: []
    };
    return uuid;
}

function loadMasterJson(callback) {
    try {
        chrome.storage.sync.get("masterKey", (result) => {
            console.info('masterJson found ' + result.masterKey);
            masterJson = JSON.parse(result.masterKey);
            if (callback) {
                callback();
            }
        });
    } catch (e) {
        console.log('Error on loadMasterJson ' + e);
    }
}

function saveMJ() {
    try {
        let stringJson = JSON.stringify(masterJson);
        chrome.storage.sync.set({"masterKey": stringJson}, () => {
            console.log('Value is set to ' + stringJson);
        });
    } catch (e) {
        console.log('Error on saveMasterJson ' + e);
    }
}

/* edit page function */

function openEditPg(_uuid) {

    if (_uuid) {
        // add the uuid to the elements and then display the page 
        saveNewFld.style.display = 'none';
        editPage.style.display = 'block';
        currOpenUuid = _uuid;

        // render the elements
        let _fldJson = masterJson[_uuid];
        let _inpHtml = ``;
        if (_fldJson) {
            $('#editFldInp').val(_fldJson.name);
            let _urls = _fldJson.urls;
            for (let i in _urls) {
                _inpHtml = _inpHtml + getEditInp(_uuid, _urls[i]);
            }
            $('#editPageUrlList').html(_inpHtml);
        } else {
            console.log('fldJson not found on openEditPg');
        }

    } else {
        console.error('uuid is not present on openEditPg call');
    }
}

function closeEditPg() {
    saveNewFld.style.display = 'block';
    editPage.style.display = 'none';
    currOpenUuid = '';
    clearEditPage();
    displayExistingFolders();
}

function clearEditPage() {
    $('#editPageUrlList').html('');
    $('#editFldInp').val('');
}


function getEditInp(uuid, url) {
    return `<div class="editInpGroup input-group" uuid="${uuid}">
                <input type="text" class="editInp list-inp-style form-control" value="${url}"  aria-describedby="">
                <div class="editInpDel">
                    <img src="/images/cross.svg" alt="X">
                </div>
            </div>`;
}

/* MJ masterJson  functions */

function addUrlToFldInMJ(uuid, url) {
    if (uuid && url) {
        try {
            let _urls = masterJson[uuid].urls;
            if (!_urls.includes(url)) {
                _urls.push(url);
            }
            masterJson[uuid].urls = _urls;
        } catch (e) {
            console.error('error on addUrlToFld ' + e);
        }
    } else {
        console.log('addUrlToFld cannot happen due to null value for uuid ' + uuid + ' url ' + url);
    }
}

function delUrlFrmFldInMJ(_uuid, _url) {
    try {
        let _fldJson = masterJson[_uuid];
        let _urls = _fldJson.urls;
        var _nwUrls = _urls.filter((el) => {
            return el != _url;
        });
        masterJson[_uuid].urls = _nwUrls;
    } catch (e) {
        console.error('error on delUrlFrmFldInMJ:' + e);
    }
}

function changeFldName(_uuid, _name) {
    try {
        if (_name) {
            masterJson[_uuid].name = _name;
        }
    } catch (e) {
        log.error('error on change fodler name for uuid:' + '_uuid' + ' and name:' + _name);
    }
}

function delFldInMJAndSave() {

}

// open all the valid urls in the array
function openTabs(urls) {
    if (urls == null || urls.length < 0) {
        console.log("urls are invalid or empty " + urls)
        return;
    }

    urls.forEach(function (url) {
        if (isValidHttpUrl(url)) {
            chrome.tabs.create({url: url});
        }
    });
}

function displayExistingFolders() {
    console.log("displayExistingFolders");
    document.getElementById("fldParent").innerHTML = '';

    // clickable folder
    for (let uuid in masterJson) {
        console.log(uuid, masterJson[uuid]);
        // add to clickable folder
        let fldParent = document.getElementById("fldParent");
        fldParent.innerHTML = fldParent.innerHTML + buildFldItm(uuid, masterJson[uuid]);
    }
}

function getUrlCount(fldJson) {
    try {
        if (fldJson && fldJson.urls) {
            return fldJson.urls.length;
        }
    } catch (e) {
        console.error('error on getUrlCount ' + e);
    }
    return 0;
}

function getNameFldJson(fldJson) {
    try {
        if (fldJson) {
            return fldJson.name;
        }
    } catch (e) {
        console.error('error on getNameFldJson ' + e);
    }
    return "";
}

// get html elements
function buildFldItm(uuid, fldJson) {
    let count = getUrlCount(fldJson);
    return `<div uuid="${uuid}" class="fldItm full-width">
    <div class="fldBody">
        <div class="fldName">
            <p class="">${fldJson.name}</p>
        </div>
        <div class="fldItmNum"><p class="">${count}</p></div>
        <div class="fldEdit"><img class="fldEditImg" src="/images/dots.svg" alt="---"></div>
        <div class="fldAdd"><img class="fldAddImg" src="/images/plus.svg" alt="+"></div>
    </div>
</div>`;
}

function buildAccFldItem(uuid, fldJson) {
    let name = getNameFldJson(fldJson);
    return `<div uuid="${uuid}" class="accExistingFld">
        <span>${name}</span>
    </div>`;
}

/* util methogs */
async function getCurrentPage() {
    let queryOptions = {active: true, lastFocusedWindow: true};
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    console.log('tab ' + tab);
    return tab;
}

function getUuid() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function isValidHttpUrl(string) {
    let url;
    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
}


function tempFunction() {
    let obj = {
        "uuid-3": {
            "name": "folder 3",
            "urls": [
                "https://www.google.com"
            ]
        },
        "uuid-2": {
            "name": "folder 2",
            "urls": [
                "https://www.stackoverflow.com",
                "https://www.wikipedia.org"
            ]
        },
        "uuid-3": {
            "name": "folder 3",
            "urls": [
                "https://www.facebook.com",
                "https://www.twitter.com"
            ]
        }
    }
    saveMJ(obj)
}
function showOverlay() {
    $("#overlay").css('display', 'block');
}
function hideOverlay() {
    $("#overlay").css('display', 'none');
}
function showModal() {
    $("#confirmModal").css('display', 'flex');
}
function hideModal() {
    $("#confirmModal").css('display', 'none');
}
