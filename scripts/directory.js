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
        $(this).siblings("ul").slideToggle("slow");
        e.preventDefault();
      });
    });
  });
}
