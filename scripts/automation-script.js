// master data upload - Script

class AutomationScript {
  masterDataOutput = "";

  // Static member
  static parentcheck = [];
  static parenth = [];

  constructor(dimension, filetype = "csv") {
    this.dimension = dimension;
    this.filetype = filetype;
    console.log("Automation activated on the dimension: " + this.dimension);
    this.headingPart = new Array();
    this.bodyPart = {};
    this.parentcheck = ["1"];
    this.totalBaseMember = 0;
    this.jv_count = 0;
    this.jv_map_list_with_dict = [];
    this.companyList = [];
    this.currencyList = [];
    this.pubList = [];
    this.geoList = [];
    this.segList = [];
    this.memberWithDescription = [];

    this.onFilter = false;

    this.pubListSelectedForFilter = [];
    this.geoListSelectedForFilter = [];
    this.segListSelectedForFilter = [];
    this.companyListSelectedForFilter = [];
    this.currencyListSelectedForFilter = [];

    // line variables
    this.lineVariables = [];

    this.jv_count_check = 1;
    this.dimensionParentStructure = {
      ENTITY: [
        "Management",
        "Hyperion BHI",
        "Stat Structure",
        "MGNT Excl JV",
        "Joint Venture Only",
        "MGNT Equity Acc",
        "JV Equity Acc",
      ],
      FLOW: ["PARENTH1", "PARENTH2", "PARENTH3", "PARENTH4"],
      ACCOUNT: ["PARENTH1", "PARENTH2", "PARENTH3", "PARENTH4"],
    };
    this.dimensionMappingList = {
      ENTITY: ["JV EA Mapping"],
    };
    this.JVPCProperty = "To indicate member of the JV_EA";
    this.EAPCProperty = "JV Equity Accounting Entity targeted";
  }

  generateIcons(outputArea) {
    while (outputArea.hasChildNodes()) {
      outputArea.removeChild(outputArea.firstChild);
    }
    automationObject.masterDataOutput.forEach((element) => {
      let area = document.createElement("button");
      area.classList.add("btn");
      area.classList.add("btn-success");
      area.classList.add("button-margin");
      let xDATA = element['"ID"'];
      let data = document.createTextNode(
        xDATA.toString().replace('"', "").replace('"', "")
      );
      area.appendChild(data);
      outputArea.appendChild(area);
    });
  }

  // Funcitonality to fetch the parents availabe in the updated heirarchy
  populateParentList() {
    let selectionMember = document.getElementById("parentselect");
    while (selectionMember.hasChildNodes()) {
      selectionMember.removeChild(selectionMember.firstChild);
    }

    automationObject.dimensionParentStructure[
      automationObject.dimension
    ].forEach((element) => {
      try {
        let parentElement = element;
        automationObject.parentcheck.push(parentElement);
        let optionElement = document.createElement("option");
        optionElement.value = parentElement;
        optionElement.innerHTML = parentElement;
        selectionMember.appendChild(optionElement);
      } catch (error) {}
    });
  }

  fetchParentMembers(ParentMode) {
    automationObject.parenth = [];
    //let parentMember = automationObject.dimensionParentStructure[automationObject.dimension][ParentMode];
    // document.getElementById("parenthvalue").innerHTML = ParentMode;
    let parentMember = ParentMode;
    let selectionMember = document.getElementById("parentmemberselect");
    let searchMember = document.getElementById("search-list-show");
    while (selectionMember.hasChildNodes()) {
      selectionMember.removeChild(selectionMember.firstChild);
    }
    while (searchMember.hasChildNodes()) {
      searchMember.removeChild(searchMember.firstChild);
    }
    let openMember = document.createElement("option");
    openMember.value = "All";
    openMember.innerHTML = "All";
    selectionMember.appendChild(openMember);

    // Getting the description
    automationObject.masterDataOutput.forEach((element) => {
      try {
        automationObject.memberWithDescription.push({
          ID: element["ID"].toString(),
          Desc: element["Description"].toString(),
        });
      } catch (e) {}
    });

    automationObject.masterDataOutput.forEach((element) => {
      try {
        let parentElement = element[parentMember].toString();
        let memberDesc = "";

        // Finding the description for the selected member
        automationObject.memberWithDescription.forEach((element) => {
          if (element["ID"] == parentElement) {
            memberDesc = element["Desc"];
          }
        });

        // .replace('"', "")
        // .replace('"', "");
        if (!automationObject.parenth.includes(parentElement)) {
          automationObject.parenth.push(parentElement);
          let optionElement = document.createElement("option");
          optionElement.value = parentElement;
          optionElement.setAttribute("data-sub-text", memberDesc);
          optionElement.innerHTML = parentElement + " - " + memberDesc;
          optionElement.dataToken = parentElement;
          selectionMember.appendChild(optionElement);

          let searchOptionElement = document.createElement("option");
          searchOptionElement.value = parentElement;
          searchOptionElement.setAttribute("data-sub-text", memberDesc);
          searchOptionElement.innerHTML = parentElement + " - " + memberDesc;
          searchOptionElement.dataToken = parentElement;
          searchMember.appendChild(searchOptionElement);
        }
      } catch (error) {
        //console.log(error.toString() + parentMember.toString());
      }
    });
    //automationObject.fetchAddOnMapping();
  }

  // INTERNAL FUNCTIONS -----------------
  findMemberByID(member) {
    return member["ID"] == document.getElementById("parentmemberselect").value;
  }

  // ----------------------------------

  fetchParentMemberDetails(member, parenth) {
    // finding its parent
    let parentDisplaySpan = document.getElementById("valuer1");
    try {
      let parent_member = automationObject.masterDataOutput.find(
        this.findMemberByID
      );
      let checkDim = document.getElementById("parentselect").value.toString();
      // console.log(parent_member[checkDim]);
      if (parent_member[checkDim].length > 0) {
        parentDisplaySpan.classList.remove("bg-danger");
        parentDisplaySpan.classList.add("bg-success");
        parentDisplaySpan.innerHTML = parent_member[checkDim];
      } else {
        parentDisplaySpan.classList.remove("bg-success");
        parentDisplaySpan.classList.add("bg-danger");
        parentDisplaySpan.innerHTML = "No parent member";
      }
    } catch (error) {
      parentDisplaySpan.classList.remove("bg-success");
      parentDisplaySpan.classList.add("bg-danger");
      parentDisplaySpan.innerHTML = "No parent member";
    }
  }

  // MAXEFFORT data function  -- RECURSIVE member -------------------------------------------------
  findingWhetherItIsAParent(checkMember) {
    return automationObject.parenth.includes(checkMember);
  }

  // Determining the tree and the respective mapping in the heirarchy
  determineTheTree(member) {
    automationObject.updateStacks();
    automationObject.removeArrowFunction();
    let listOrder = document.createElement("ul");
    let jv_mapping_list = document.createElement("ul");
    let members = [];
    var checkCount = 0;

    automationObject.masterDataOutput.forEach((element) => {
      let listMembers = document.createElement("li");
      if (element[document.getElementById("parentselect").value] == member) {
        //  members.push(element["ID"]);
        var checkCC = "IDS";
        var checkCur = "EAC";
        var checkPUB = "PP";
        var checkGEO = "GEO";
        var checkSEG = "SEG";

        try {
          checkCC = element["COMP_CODE"].toString();
        } catch (e) {}
        try {
          checkCur = element["Currency"].toString();
        } catch (e) {}
        try {
          checkPUB = element["PUB"].toString();
        } catch (e) {}
        try {
          checkSEG = element["SEGMENT"].toString();
        } catch (e) {}
        try {
          checkGEO = element["Country for Segmental Reporting"].toString();
        } catch (e) {}

        let text = "";
        if (automationObject.parenth.includes(element["ID"])) {
          text = document.createTextNode(
            element["ID"].toString() +
              " - " +
              element["Description"].toString() +
              "  "
          );
          if (automationObject.onFilter) {
            listMembers.appendChild(text);
          }
        }

        if (
          (automationObject.companyListSelectedForFilter.includes(checkCC) ||
            automationObject.companyListSelectedForFilter.length == 0) &&
          (automationObject.currencyListSelectedForFilter.includes(checkCur) ||
            automationObject.currencyListSelectedForFilter.length == 0) &&
          (automationObject.pubListSelectedForFilter.includes(checkPUB) ||
            automationObject.pubListSelectedForFilter.length == 0) &&
          (automationObject.geoListSelectedForFilter.includes(checkGEO) ||
            automationObject.geoListSelectedForFilter.length == 0) &&
          (automationObject.segListSelectedForFilter.includes(checkSEG) ||
            automationObject.segListSelectedForFilter.length == 0)
        ) {
          text = document.createTextNode(
            element["ID"].toString() +
              " - " +
              element["Description"].toString() +
              "  "
          );
          listMembers.appendChild(text);
        }
        // getting the company code stack
        try {
          if (!automationObject.companyList.includes(element["COMP_CODE"])) {
            automationObject.companyList.push(element["COMP_CODE"]);
          }
        } catch (e) {}

        // getting the currency stack
        try {
          if (
            !automationObject.currencyList.includes(element["Currency"]) &&
            element["Currency"] != "undefined"
          ) {
            automationObject.currencyList.push(element["Currency"]);
          }
        } catch (e) {}

        // getting the PUB code stack
        try {
          if (!automationObject.pubList.includes(element["PUB"])) {
            automationObject.pubList.push(element["PUB"]);
          }
        } catch (e) {}

        // getting the SEG code stack
        try {
          if (!automationObject.segList.includes(element["SEGMENT"])) {
            automationObject.segList.push(element["SEGMENT"]);
          }
        } catch (e) {}

        // getting the GEO stack
        try {
          if (
            !automationObject.geoList.includes(
              element["Country for Segmental Reporting"]
            ) &&
            element["Country for Segmental Reporting"] != "undefined"
          ) {
            automationObject.geoList.push(
              element["Country for Segmental Reporting"]
            );
          }
        } catch (e) {}

        // Currency
        try {
          let currency = document.createElement("span");
          //  <span class="badge bg-primary">Primary</span>
          currency.classList.add("badge");
          currency.classList.add("bg-secondary");
          currency.classList.add("rounded-pill");
          let curr = document.createTextNode(element["Currency"].toString());
          currency.appendChild(curr);
          listMembers.appendChild(currency);
          if (curr.length > 1) {
          }
        } catch (error) {
          //console.log(error.toString());
        }

        checkCount++;
        if (
          (automationObject.companyListSelectedForFilter.includes(checkCC) ||
            automationObject.companyListSelectedForFilter.length == 0) &&
          (automationObject.currencyListSelectedForFilter.includes(checkCur) ||
            automationObject.currencyListSelectedForFilter.length == 0) &&
          (automationObject.pubListSelectedForFilter.includes(checkPUB) ||
            automationObject.pubListSelectedForFilter.length == 0) &&
          (automationObject.geoListSelectedForFilter.includes(checkGEO) ||
            automationObject.geoListSelectedForFilter.length == 0) &&
          (automationObject.segListSelectedForFilter.includes(checkSEG) ||
            automationObject.segListSelectedForFilter.length == 0)
        ) {
          // JV PC check
          try {
            if (element[automationObject.JVPCProperty].toString() === "Y") {
              let JVPC = document.createElement("span");
              JVPC.classList.add("badge");
              JVPC.classList.add("bg-danger");
              JVPC.classList.add("rounded-pill");
              JVPC.setAttribute("id", element["ID"].toString());
              let jv = document.createTextNode("JV PC");
              JVPC.appendChild(jv);
              listMembers.appendChild(JVPC);
              if (element[automationObject.JVPCProperty].toString() === "Y") {
                let jv = document.createTextNode(
                  element[automationObject.EAPCProperty].toString()
                );

                // JV EA Dict mapping to show arrow
                let temp_dict = {
                  jv: element["ID"].toString(),
                  ea: "des" + element["ID"].toString(),
                };

                automationObject.jv_map_list_with_dict.push(temp_dict);
                // EAPC.appendChild(jv);
                // listMembers.appendChild(EAPC);

                // Updating the JV PC mapping list in the respective area

                document.getElementById("mapping_name").innerHTML =
                  "JV Mapping";
                let jv_mapping_item = document.createElement("li");
                let jv_a_link = document.createElement("a");
                let link_data = document.createTextNode(
                  element["ID"].toString()
                );
                jv_a_link.appendChild(link_data);
                jv_a_link.setAttribute("href", "#" + element["ID"].toString());
                jv_a_link.setAttribute("id", "des" + element["ID"].toString());
                let jv_mem = document.createTextNode(
                  "  " + element[automationObject.EAPCProperty].toString()
                );

                let EAPC = document.createElement("span");
                EAPC.classList.add("badge");
                EAPC.classList.add("bg-success");
                EAPC.classList.add("rounded-pill");
                EAPC.classList.add("spacingg");
                let content = document.createTextNode("EA PC");
                EAPC.appendChild(content);

                jv_mapping_item.appendChild(jv_a_link);
                jv_mapping_item.appendChild(jv_mem);
                jv_mapping_item.appendChild(EAPC);
                jv_mapping_list.appendChild(jv_mapping_item);
                automationObject.jv_count += 1;
                let sad_face = document.getElementById("sad-face");
                sad_face.style.display = "none";
              }
            }
          } catch (error) {
            // console.log(error);
          }
          listOrder.appendChild(listMembers);
        }

        if (automationObject.parenth.includes(element["ID"])) {
          listOrder.appendChild(listMembers);
        } else {
          automationObject.totalBaseMember++;
        }
        if (
          automationObject.masterDataOutput.filter(
            this.findingWhetherItIsAParent
          )
        ) {
          // console.log("parent found");
          listMembers.appendChild(
            this.determineTheTree(element["ID"].toString())
          );
        }

        // automationObject.companyListSelectedForFilter = [];
        // automationObject.updateStacks();

        document.getElementById("valuer2").innerHTML =
          automationObject.totalBaseMember.toString() + " members";
      }
    });

    let jv_mapping_div = document.getElementById("jv_mapping");
    jv_mapping_div.appendChild(jv_mapping_list);

    let useless = document.createElement("span");

    return checkCount > 0 ? listOrder : useless;
  }

  // Generate arrow:
  arrowFunction() {
    try {
      let mappingArrayLength = automationObject.jv_map_list_with_dict.length;
      for (let i = 0; i < mappingArrayLength; i++) {
        var myLine = new LeaderLine(
          document.getElementById(
            automationObject.jv_map_list_with_dict[i]["ea"]
          ),
          document.getElementById(
            automationObject.jv_map_list_with_dict[i]["jv"]
          )
        );
        myLine.setOptions({
          color: "#0099ff",
        });

        myLine.hide();

        //myLine.show('fade', { duration: 300, timing: "linear" });
        automationObject.lineVariables.push(myLine);
        document.getElementById("showMappingLinks").checked = false;
      }
      // automationObject.jv_map_list_with_dict = [];
    } catch (e) {}
  }

  removeArrowFunction() {
    for (let i = 0; i < automationObject.lineVariables.length; i++) {
      automationObject.lineVariables[i].remove();
    }
    automationObject.lineVariables = [];
  }

  hideArrowFunction() {
    for (let i = 0; i < automationObject.lineVariables.length; i++) {
      automationObject.lineVariables[i].hide();
    }
  }

  showArrowFunction() {
    for (let i = 0; i < automationObject.lineVariables.length; i++) {
      automationObject.lineVariables[i].show();
    }
  }

  //myLine.position()
  reArrowFunction() {
    for (let i = 0; i < automationObject.lineVariables.length; i++) {
      automationObject.lineVariables[i].position();
    }
  }

  // Function to fetch the master data from the user
  async getMasterDataFromUser(data) {
    //console.log("Fetching the master data from the user....");
    var fileVariable = new FileReader();
    fileVariable.onload = function (event) {
      function parseToCSV(str, headList, bodyList) {
        const heading = str
          .replace('"', "")
          .replace('"', "")
          .slice(0, str.indexOf("\n"))
          .split(",");
        const body = str
          .replace('"', "")
          .replace('"', "")
          .slice(str.indexOf("\n") + 1)
          .split("\n");
        const arr = body.map(function (row) {
          const values = row.split(",");
          const el = heading.reduce(function (object, header, index) {
            object[header] = values[index];
            return object;
          }, {});
          return el;
        });
        return arr;
      }

      var output = parseToCSV(
        event.target.result,
        this.headingPart,
        this.bodyPart
      );
      automationObject.masterDataOutput = output;
      automationObject.parenth1 = [];
      automationObject.parenth2 = [];
    };
    fileVariable.readAsText(data);
  }

  fetchAddOnMapping() {
    let selectionMember = document.getElementById("dimensionAdd-on-mapping");
    while (selectionMember.hasChildNodes()) {
      selectionMember.removeChild(selectionMember.firstChild);
    }

    let openMember = document.createElement("option");
    openMember.value = "select";
    openMember.innerHTML = "--- select ---";
    selectionMember.appendChild(openMember);

    automationObject.dimensionMappingList[this.dimension].forEach((element) => {
      let optionElement = document.createElement("option");
      optionElement.value = element;
      optionElement.innerHTML = element;
      optionElement.dataToken = element;
      selectionMember.appendChild(optionElement);
    });
  }

  updateStacks() {
    // CURRENCY
    let selectionMember = document.getElementById("currency-stack");
    while (selectionMember.hasChildNodes()) {
      selectionMember.removeChild(selectionMember.firstChild);
    }

    for (let i = 0; i < automationObject.currencyList.length; i++) {
      let span_currency = document.createElement("span");
      span_currency.classList.add("badge");
      span_currency.setAttribute("id", automationObject.currencyList[i]);
      span_currency.setAttribute("onclick", "selectForCurrencyFilter(this.id)");

      if (
        automationObject.currencyListSelectedForFilter.includes(
          automationObject.currencyList[i]
        )
      ) {
        span_currency.classList.add("bg-danger");
      } else {
        span_currency.classList.add("bg-primary");
      }
      span_currency.setAttribute("selected-for-filter1", "no");
      span_currency.classList.add("spacingg");
      let content = document.createTextNode(automationObject.currencyList[i]);
      span_currency.appendChild(content);
      document.getElementById("currency-stack").appendChild(span_currency);
    }

    // COMPANY CODE
    let selectionMember2 = document.getElementById("company-stack");
    while (selectionMember2.hasChildNodes()) {
      selectionMember2.removeChild(selectionMember2.firstChild);
    }

    for (let i = 0; i < automationObject.companyList.length; i++) {
      let span_company = document.createElement("span");
      span_company.setAttribute("id", automationObject.companyList[i]);
      span_company.setAttribute("onclick", "selectForCompanyFilter(this.id)");
      span_company.classList.add("badge");
      if (
        automationObject.companyListSelectedForFilter.includes(
          automationObject.companyList[i]
        )
      ) {
        span_company.classList.add("bg-danger");
      } else {
        span_company.classList.add("bg-primary");
      }
      span_company.setAttribute("selected-for-filter", "no");
      //span_company.classList.add("rounded-pill");
      span_company.classList.add("spacingg");
      let content = document.createTextNode(automationObject.companyList[i]);
      span_company.appendChild(content);
      document.getElementById("company-stack").appendChild(span_company);
    }

    // PUB
    let selectionMember3 = document.getElementById("pub-stack");
    while (selectionMember3.hasChildNodes()) {
      selectionMember3.removeChild(selectionMember3.firstChild);
    }

    for (let i = 0; i < automationObject.pubList.length; i++) {
      let span_pub = document.createElement("span");
      span_pub.classList.add("badge");
      span_pub.setAttribute("id", automationObject.pubList[i]);
      span_pub.setAttribute("onclick", "selectForPUBFilter(this.id)");

      if (
        automationObject.pubListSelectedForFilter.includes(
          automationObject.pubList[i]
        )
      ) {
        span_pub.classList.add("bg-danger");
      } else {
        span_pub.classList.add("bg-primary");
      }
      span_pub.setAttribute("selected-for-filter2", "no");
      span_pub.classList.add("spacingg");
      let content = document.createTextNode(automationObject.pubList[i]);
      span_pub.appendChild(content);
      document.getElementById("pub-stack").appendChild(span_pub);
    }

    // GEO
    let selectionMember4 = document.getElementById("geo-stack");
    while (selectionMember4.hasChildNodes()) {
      selectionMember4.removeChild(selectionMember4.firstChild);
    }

    for (let i = 0; i < automationObject.geoList.length; i++) {
      let span_geo = document.createElement("span");
      span_geo.classList.add("badge");
      span_geo.setAttribute("id", automationObject.geoList[i]);
      span_geo.setAttribute("onclick", "selectForGEOFilter(this.id)");

      if (
        automationObject.geoListSelectedForFilter.includes(
          automationObject.geoList[i]
        )
      ) {
        span_geo.classList.add("bg-danger");
      } else {
        span_geo.classList.add("bg-primary");
      }
      span_geo.setAttribute("selected-for-filter3", "no");
      span_geo.classList.add("spacingg");
      let content = document.createTextNode(automationObject.geoList[i]);
      span_geo.appendChild(content);
      document.getElementById("geo-stack").appendChild(span_geo);
    }

    // SEG
    let selectionMember5 = document.getElementById("seg-stack");
    while (selectionMember5.hasChildNodes()) {
      selectionMember5.removeChild(selectionMember5.firstChild);
    }

    for (let i = 0; i < automationObject.segList.length; i++) {
      let span_seg = document.createElement("span");
      span_seg.classList.add("badge");
      span_seg.setAttribute("id", automationObject.segList[i]);
      span_seg.setAttribute("onclick", "selectForSEGFilter(this.id)");

      if (
        automationObject.segListSelectedForFilter.includes(
          automationObject.segList[i]
        )
      ) {
        span_seg.classList.add("bg-danger");
      } else {
        span_seg.classList.add("bg-primary");
      }
      span_seg.setAttribute("selected-for-filter4", "no");
      span_seg.classList.add("spacingg");
      let content = document.createTextNode(automationObject.segList[i]);
      span_seg.appendChild(content);
      document.getElementById("seg-stack").appendChild(span_seg);
    }
  }
}
//  -- END OF CLASS ------------------------------------------

// GLOBAL VARIABLE ------------------------------------------
var automationObject = new AutomationScript("dimension");

// -- GLOBAL FUNCTIONS ---------------------------------------

function showPopupAlert(message) {
  let alertArea = document.getElementById("alert");
  alertArea.style.display = "block";
  alertArea.innerHTML = message;
}

function hidePopupAlert() {
  let alertArea = document.getElementById("alert");
  alertArea.style.display = "none";
}

function activateMasterData() {
  // showPopupAlert("Uploading and Processing the Dimension... please wait");
  let dimension = document.getElementById("masterData").value;

  document.getElementById("showdim").classList.toggle("anim-typewriter");
  document.getElementById("showdim").innerHTML = dimension;
  document.getElementById("showdim").classList.toggle("anim-typewriter");

  //document.getElementById("showdim1").innerHTML = dimension;
  //document.getElementById("showdim2").innerHTML = dimension;
  automationObject = new AutomationScript(dimension);
  if (dimension === "Select the master data template") {
    alert("Select the master data dimension template from the list!");
    return;
  }
  if (document.getElementById("uploadedFile").files[0]) {
    automationObject.getMasterDataFromUser(
      document.getElementById("uploadedFile").files[0]
    );
  }
  //hidePopupAlert();
  if (automationObject.dimension === "ENTITY") {
    document.getElementById("entity-related-stacks").style.display = "block";
  } else {
    document.getElementById("entity-related-stacks").style.display = "none";
  }
  processMasterData();
}

function alphabetizeList() {
  var sel = $(listField);
  var selected = sel.val();
  var opts_list = sel.find("option");
  opts_list.sort(function (a, b) {
    return $(a).text() > $(b).text() ? 1 : -1;
  });
  sel.html("").append(opts_list);
  sel.val(selected);
}

function processMasterData() {
  // ------------------  PROCESS BUTTON
  //showPopupAlert("Processing the dimension, please wait....");
  document.getElementById("showdim").classList.toggle("anim-typewriter");
  let outputArea = document.getElementById("outputarea");
  //automationObject.generateIcons(outputArea);
  automationObject.populateParentList();
  //automationObject.fetchAddOnMapping();
  //alphabetizeList("select.parenth1select option");
  hidePopupAlert();
  alert("Data has been processed successfully");
}

function fetchParentMemberFromSelection() {
  // ----- On change ------ PARENT select dropdown
  automationObject.fetchParentMembers(
    document.getElementById("parentselect").value
  );
}

function fetchParentMemberDetails() {
  automationObject.fetchParentMemberDetails(
    document.getElementById("parentmemberselect").value,
    document.getElementById("parentselect").value
  );
}

function generateTreeA() {
  $("#toast").toast("show");
  clearStack();
  generateTree();
}

function generateTree() {
  $(".toast").toast("show");
  automationObject.removeArrowFunction();
  let outputarea = document.getElementById("outputarea");
  automationObject.totalBaseMember = 0;
  document.getElementById("showMember").innerHTML = document
    .getElementById("parentmemberselect")
    .value.toString();
  let selectionMember = outputarea;
  while (selectionMember.hasChildNodes()) {
    selectionMember.removeChild(selectionMember.firstChild);
  }

  let jvArea = document.getElementById("jv_mapping");
  while (jvArea.hasChildNodes()) {
    jvArea.removeChild(jvArea.firstChild);
  }

  let divmember = document.createElement("div");
  let sad_face = document.getElementById("sad-face");
  sad_face.style.display = "block";
  document.getElementById("mapping_name").innerHTML = "";
  divmember.appendChild(
    automationObject.determineTheTree(
      document.getElementById("parentmemberselect").value
    )
  );
  document.getElementById("showMappingDiv").style.display = "block";
  outputarea.appendChild(divmember);
  loadFolder();
  automationObject.showArrowFunction();
  automationObject.updateStacks();
  //automationObject.currencyList = [];

  automationObject.arrowFunction();
  automationObject.jv_map_list_with_dict = [];
  automationObject.companyList = [];
  //automationObject.companyListSelectedForFilter = [];
}

const getDataFormTemp = document.getElementById("getDataForm");
getDataFormTemp.addEventListener("submit", function (e) {
  //------------------------------ UPLOAD BUTTON
  e.preventDefault();
  $("#uploadinform").toast("show");
  activateMasterData();
  fetchParentMemberFromSelection();
});

function loadFolder() {
  $(document).ready(function () {
    var allFolders = $(".directory-list li > ul");
    allFolders.each(function () {
      var folderAndName = $(this).parent();
      folderAndName.addClass("folder");
      var backupOfThisFolder = $(this);
      $(this).remove();
      folderAndName.wrapInner("<a href='#' />");
      folderAndName.append(backupOfThisFolder);
      folderAndName.find("a").click(function (e) {
        automationObject.hideArrowFunction();
        $(this).siblings("ul").slideToggle("slow");
        e.preventDefault();
        //automationObject.removeArrowFunction();
        document.getElementById("showMappingDiv").style.display = "none";
      });
    });
  });
}

function toggleDesign() {
  document.getElementById("showdim").classList.toggle("anim-typewriter");
}

function updateSearchItemInParent() {
  document.getElementById("parentmemberselect").value =
    document.getElementById("searchArea").value;
}

function toggleMappingView() {
  let member = document.getElementById("showMappingLinks");
  if (member.checked == false) {
    automationObject.hideArrowFunction();
  } else {
    automationObject.showArrowFunction();
  }
}

// FILTERING THE COMPANY FILTER
function selectForCompanyFilter(element) {
  // Getting the member selected on the company
  if (
    document
      .getElementById(element.toString())
      .getAttribute("selected-for-filter") == "no"
  ) {
    automationObject.companyListSelectedForFilter.push(element);
    document.getElementById(element.toString()).classList.remove("bg-primary");
    document.getElementById(element.toString()).classList.add("bg-success");
    document
      .getElementById(element.toString())
      .setAttribute("selected-for-filter", "yes");
  } else {
    automationObject.companyListSelectedForFilter.pop(element);
    document.getElementById(element.toString()).classList.remove("bg-success");
    document.getElementById(element.toString()).classList.add("bg-primary");
    document
      .getElementById(element.toString())
      .setAttribute("selected-for-filter", "no");
  }
}

function selectForCurrencyFilter(element) {
  // Getting the member selected on the company
  if (
    document
      .getElementById(element.toString())
      .getAttribute("selected-for-filter1") == "no"
  ) {
    automationObject.currencyListSelectedForFilter.push(element);
    document.getElementById(element.toString()).classList.remove("bg-primary");
    document.getElementById(element.toString()).classList.add("bg-success");
    document
      .getElementById(element.toString())
      .setAttribute("selected-for-filter1", "yes");
  } else {
    automationObject.currencyListSelectedForFilter.pop(element);
    document.getElementById(element.toString()).classList.remove("bg-success");
    document.getElementById(element.toString()).classList.add("bg-primary");
    document
      .getElementById(element.toString())
      .setAttribute("selected-for-filter1", "no");
  }
}

// FILTERING THE PUB
function selectForPUBFilter(element) {
  // Getting the member selected on the company
  if (
    document
      .getElementById(element.toString())
      .getAttribute("selected-for-filter2") == "no"
  ) {
    automationObject.pubListSelectedForFilter.push(element);
    document.getElementById(element.toString()).classList.remove("bg-primary");
    document.getElementById(element.toString()).classList.add("bg-success");
    document
      .getElementById(element.toString())
      .setAttribute("selected-for-filter2", "yes");
  } else {
    automationObject.pubListSelectedForFilter.pop(element);
    document.getElementById(element.toString()).classList.remove("bg-success");
    document.getElementById(element.toString()).classList.add("bg-primary");
    document
      .getElementById(element.toString())
      .setAttribute("selected-for-filter2", "no");
  }
}

// FILTERING THE PUB
function selectForGEOFilter(element) {
  // Getting the member selected on the company
  if (
    document
      .getElementById(element.toString())
      .getAttribute("selected-for-filter3") == "no"
  ) {
    automationObject.geoListSelectedForFilter.push(element);
    document.getElementById(element.toString()).classList.remove("bg-primary");
    document.getElementById(element.toString()).classList.add("bg-success");
    document
      .getElementById(element.toString())
      .setAttribute("selected-for-filter3", "yes");
  } else {
    automationObject.geoListSelectedForFilter.pop(element);
    document.getElementById(element.toString()).classList.remove("bg-success");
    document.getElementById(element.toString()).classList.add("bg-primary");
    document
      .getElementById(element.toString())
      .setAttribute("selected-for-filter3", "no");
  }
}

// FILTERING THE SEG
function selectForSEGFilter(element) {
  // Getting the member selected on the company
  if (
    document
      .getElementById(element.toString())
      .getAttribute("selected-for-filter4") == "no"
  ) {
    automationObject.segListSelectedForFilter.push(element);
    document.getElementById(element.toString()).classList.remove("bg-primary");
    document.getElementById(element.toString()).classList.add("bg-success");
    document
      .getElementById(element.toString())
      .setAttribute("selected-for-filter4", "yes");
  } else {
    automationObject.segListSelectedForFilter.pop(element);
    document.getElementById(element.toString()).classList.remove("bg-success");
    document.getElementById(element.toString()).classList.add("bg-primary");
    document
      .getElementById(element.toString())
      .setAttribute("selected-for-filter4", "no");
  }
}

// Clear filter
function clearFilters() {
  automationObject.companyListSelectedForFilter = [];
  automationObject.currencyListSelectedForFilter = [];
  automationObject.geoListSelectedForFilter = [];
  automationObject.segListSelectedForFilter = [];
  automationObject.pubListSelectedForFilter = [];
  // automationObject.updateStacks();
  generateTree();
}

function clearStack() {
  automationObject.onFilter = false;
  automationObject.currencyList = [];
  automationObject.pubList = [];
  automationObject.companyList = [];
  automationObject.segList = [];
  automationObject.geoList = [];
}

function setfilter() {
  automationObject.onFilter = true;
  generateTree();
}
