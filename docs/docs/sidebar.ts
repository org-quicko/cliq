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
      label: "API",
      items: [
        {
          type: "doc",
          id: "api-introduction",
          label: "Introduction",
        },
        {
          type: "category",
          label: "Promoter Open API",
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
                  label: "Get commissions for a referral",
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
  ],
};

export default sidebar.apisidebar;
