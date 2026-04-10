import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "index",
      label: "Introduction",
    },
    {
      type: "doc",
      id: "installation",
      label: "Getting Started",
    },
    {
      type: "category",
      label: "Open API",
      items: [
        {
          type: "doc",
          id: "api-introduction",
          label: "Introduction",
        },
        {
          type: "category",
          label: "Program",
          items: [
            {
              type: "category",
              label: "Program",
              items: [
                {
                  type: "doc",
                  id: "create-program",
                  label: "Create program",
                  className: "api-method post",
                },
                {
                  type: "doc",
                  id: "get-programs",
                  label: "Get all programs",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "get-program-summary",
                  label: "Get programs summary list",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "get-program",
                  label: "Get program",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "update-program",
                  label: "Update program",
                  className: "api-method patch",
                },
                {
                  type: "doc",
                  id: "delete-program",
                  label: "Delete program",
                  className: "api-method delete",
                },
                {
                  type: "doc",
                  id: "program-signups",
                  label: "Get signups in program",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "program-report",
                  label: "Get program report",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "program-purchases",
                  label: "Get purchases in program",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "program-commissions",
                  label: "Get all commissions",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "program-referrals",
                  label: "Get all referrals",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "get-program-analytics",
                  label: "Get program analytics",
                  className: "api-method get",
                },
              ],
            },
            {
              type: "category",
              label: "Api Key",
              items: [
                {
                  type: "doc",
                  id: "generate-program-key",
                  label: "Generate API key",
                  className: "api-method post",
                },
                {
                  type: "doc",
                  id: "get-program-key",
                  label: "Get API key",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "delete-program-key",
                  label: "Delete API key",
                  className: "api-method delete",
                },
              ],
            },
            {
              type: "category",
              label: "User",
              items: [
                {
                  type: "doc",
                  id: "user-sign-up",
                  label: "User sign up",
                  className: "api-method post",
                },
                {
                  type: "doc",
                  id: "user-login",
                  label: "User log in",
                  className: "api-method post",
                },
                {
                  type: "doc",
                  id: "get-user",
                  label: "Get user",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "update-userr-info",
                  label: "Update user info",
                  className: "api-method patch",
                },
                {
                  type: "doc",
                  id: "delete-user",
                  label: "Delete user",
                  className: "api-method delete",
                },
                {
                  type: "doc",
                  id: "invite-user",
                  label: "Invite user",
                  className: "api-method post",
                },
                {
                  type: "doc",
                  id: "get-all-users",
                  label: "Get all users",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "update-role",
                  label: "Update role",
                  className: "api-method patch",
                },
                {
                  type: "doc",
                  id: "remove-user",
                  label: "Remove user",
                  className: "api-method delete",
                },
                {
                  type: "doc",
                  id: "leave-program",
                  label: "Leave program",
                  className: "api-method patch",
                },
              ],
            },
            {
              type:"category",
              label:"Promoter",
              items:[
                {
                  type: "doc",
                  id: "get-top-promoters",
                  label: "Get top promoters",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "get-promoter-summary",
                  label: "Get promoter summary",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "get-promoter-link-summary",
                  label: "Get promoter links summary",
                  className: "api-method get",
                }
              ]
            },
            {
              type: "category",
              label: "Circle",
              items: [
                {
                  type: "doc",
                  id: "create-circle",
                  label: "Create circle",
                  className: "api-method post",
                },
                {
                  type: "doc",
                  id: "get-circles",
                  label: "Get all circles",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "get-circle",
                  label: "Get circle",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "update-circle",
                  label: "Update circle",
                  className: "api-method patch",
                },
                {
                  type: "doc",
                  id: "delete-circle",
                  label: "Delete circle",
                  className: "api-method delete",
                },
                {
                  type: "doc",
                  id: "add-promoter",
                  label: "Add promoter",
                  className: "api-method post",
                },
                {
                  type: "doc",
                  id: "get-all-promoters",
                  label: "Get all promoters",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "remove-promoter",
                  label: "Remove promoter",
                  className: "api-method delete",
                },
              ],
            },
            {
              type: "category",
              label: "Function",
              items: [
                {
                  type: "doc",
                  id: "create-function",
                  label: "Create function",
                  className: "api-method post",
                },
                {
                  type: "doc",
                  id: "get-all-functions",
                  label: "Get all functions",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "get-function",
                  label: "Get function",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "update-function",
                  label: "Update function",
                  className: "api-method patch",
                },
                {
                  type: "doc",
                  id: "delete-function",
                  label: "Delete function",
                  className: "api-method delete",
                },
              ],
            },
            {
              type: "category",
              label: "Webhook",
              items: [
                {
                  type: "doc",
                  id: "create-webhook",
                  label: "Create webhook",
                  className: "api-method post",
                },
                {
                  type: "doc",
                  id: "get-webhooks",
                  label: "Get all webhooks",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "get-webhook",
                  label: "Get webhook",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "update-webhook",
                  label: "Update webhook",
                  className: "api-method patch",
                },
                {
                  type: "doc",
                  id: "delete-webhook",
                  label: "Delete webhook",
                  className: "api-method delete",
                },
              ],
            },
            
          ],
        },
        {
          type: "category",
          label: "Promoter",
          items: [
            {
              type: "category",
              label: "Promoter",
              items: [
                {
                  type: "doc",
                  id: "get-promoter",
                  label: "Get promoter",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "delete-promoter",
                  label: "Delete promoter",
                  className: "api-method delete",
                },
                {
                  type: "doc",
                  id: "invite-member",
                  label: "Invite member",
                  className: "api-method post",
                },
                {
                  type: "doc",
                  id: "all-members",
                  label: "Get all members",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "remove-member",
                  label: "Remove member",
                  className: "api-method patch",
                },
                {
                  type: "doc",
                  id: "promoter-signups",
                  label: "Get signups",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "promoter-purchases",
                  label: "Get purchases",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "promoter-referrals-program",
                  label: "Get all referrals",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "promoter-referral",
                  label: "Get referral",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "promoter-commissions",
                  label: "Get commissions",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "promoter-analytics",
                  label: "Get analytics",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "promoter-link-analytics",
                  label: "Get link analytics",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "promoter-signup-report",
                  label: "Get signups report",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "promoter-purchases-report",
                  label: "Get purchases report",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "promoter-commission-report",
                  label: "Get commissions report",
                  className: "api-method get",
                },
              ],
            },
            {
              type: "category",
              label: "Member",
              items: [
                {
                  type: "doc",
                  id: "get-member",
                  label: "Get member",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "update-member",
                  label: "Update member",
                  className: "api-method patch",
                },
                {
                  type: "doc",
                  id: "delete-member",
                  label: "Delete member",
                  className: "api-method delete",
                },
              ],
            },
            {
              type: "category",
              label: "Link",
              items: [
                {
                  type: "doc",
                  id: "create-link",
                  label: "Create link",
                  className: "api-method post",
                },
                {
                  type: "doc",
                  id: "getall-links",
                  label: "Get all links",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "get-link",
                  label: "Get link",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "delete-link",
                  label: "Delete link",
                  className: "api-method patch",
                },
              ],
            },
            {
              type: "category",
              label: "Api Key",
              items: [
                {
                  type: "doc",
                  id: "generate-key",
                  label: "Generate API key",
                  className: "api-method post",
                },
                {
                  type: "doc",
                  id: "get-key",
                  label: "Get API key",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "delete-key",
                  label: "Delete API key",
                  className: "api-method delete",
                },
              ],
            },
             {
              type: "category",
              label: "Webhook",
              items: [
                {
                  type: "doc",
                  id: "create-promoter-webhook",
                  label: "Create webhook",
                  className: "api-method post",
                },
                {
                  type: "doc",
                  id: "get-promoter-webhooks",
                  label: "Get all promoter webhooks",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "get-promoter-webhook",
                  label: "Get webhook",
                  className: "api-method get",
                },
                {
                  type: "doc",
                  id: "update-promoter-webhook",
                  label: "Update webhook",
                  className: "api-method patch",
                },
                {
                  type: "doc",
                  id: "delete-promoter-webhook",
                  label: "Delete webhook",
                  className: "api-method delete",
                },
              ],
            },
            {
              type: "category",
              label: "Signup",
              items: [
                {
                  type: "doc",
                  id: "signup",
                  label: "Create Signup",
                  className: "api-method post",
                },
              ],
            },
            {
              type: "category",
              label: "Purchase",
              items: [
                {
                  type: "doc",
                  id: "purchase",
                  label: "Create Purchase",
                  className: "api-method post",
                },
              ],
            },
           
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Events",
      items: [
        {
          type: "doc",
          id: "events/events-introduction",
          label: "Introduction",
        },
        {
          type: "doc",
          id: "events/signup-created",
          label: "signup.created",
        },
        {
          type: "doc",
          id: "events/purchase-created",
          label: "purchase.created",
        },
        {
          type: "doc",
          id: "events/commission-created",
          label: "commission.created",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;

