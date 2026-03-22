import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "index",
      label: "Introduction",
    },
    {
      type: "category",
      label: "API",
      items: [
        {
          type: "doc",
          id: "api-introduction",
          label: "Introduction",
        },
        {
          type: "category",
          label: "Member",
          items: [
            {
              type: "doc",
              id: "member-signup",
              label: "Member sign up",
              className: "api-method post",
            },
            {
              type: "doc",
              id: "member-login",
              label: "Member log in",
              className: "api-method post",
            },
            {
              type: "doc",
              id: "get-member",
              label: "Get member",
              className: "api-method get",
            },
            {
              type: "doc",
              id: "update-member",
              label: "Update member info",
              className: "api-method patch",
            },
            {
              type: "doc",
              id: "delete-member",
              label: "Delete member",
              className: "api-method delete",
            },
            {
              type: "doc",
              id: "member-promoter",
              label: "Get Promoter of Member",
              className: "api-method get",
            },
            {
              type: "doc",
              id: "member-exists",
              label: "Check member existence in program",
              className: "api-method post",
            },
          ],
        },
        {
          type: "category",
          label: "Promoter",
          items: [
            {
              type: "doc",
              id: "create-promoter",
              label: "Create promoter",
              className: "api-method post",
            },
            {
              type: "doc",
              id: "get-promoter",
              label: "Get promoter",
              className: "api-method get",
            },
            {
              type: "doc",
              id: "update-promoter",
              label: "Update promoter info",
              className: "api-method patch",
            },
            {
              type: "doc",
              id: "delete-promoter",
              label: "Delete promoter",
              className: "api-method delete",
            },
            {
              type: "doc",
              id: "register-for-program",
              label: "Register for program",
              className: "api-method post",
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
              id: "update-role",
              label: "Update role",
              className: "api-method patch",
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
              label: "Get signups for promoter",
              className: "api-method get",
            },
            {
              type: "doc",
              id: "promoter-purchases",
              label: "Get purchases for promoter",
              className: "api-method get",
            },
            {
              type: "doc",
              id: "promoter-referrals-program",
              label: "Get promoter referrals (in a program)",
              className: "api-method get",
            },
            {
              type: "doc",
              id: "promoter-referral",
              label: "Get promoter referral",
              className: "api-method get",
            },
            {
              type: "doc",
              id: "promoter-commissions",
              label: "Get promoter commissions",
              className: "api-method get",
            },
            {
              type: "doc",
              id: "promoter-analytics",
              label: "Get promoter analytics",
              className: "api-method get",
            },
            {
              type: "doc",
              id: "promoter-link-analytics",
              label: "Get promoter link analytics",
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
              id: "promoter-referral-report",
              label: "Get referrals report",
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
              label: "Delete a link",
              className: "api-method patch",
            },
            {
              type: "doc",
              id: "promoter-links-report",
              label: "Get links report",
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
              id: "generate-key",
              label: "Generate API Key",
              className: "api-method post",
            },
            {
              type: "doc",
              id: "get-key",
              label: "Get API Key",
              className: "api-method get",
            },
            {
              type: "doc",
              id: "delete-key",
              label: "Delete API Key",
              className: "api-method delete",
            },
          ],
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
