"use strict";
feather.replace();

        // JavaScript code to set active menu item based on current URL
        document.addEventListener("DOMContentLoaded", function() {
            var currentUrl = window.location.href;
            var menuLinks = document.querySelectorAll('.menu a');
        
            menuLinks.forEach(function(menuLink) {
                // Remove 'active' class from all menu items
                menuLink.parentNode.classList.remove('active');
        
                // Check if the link's href matches the current URL
                if (menuLink.href === currentUrl) {
                    menuLink.parentNode.classList.add('active');
                }
            });
        });