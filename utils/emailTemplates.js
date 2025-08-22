const generateDraftReminderEmail = ({ summaryData }) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f4f4f7;
        color: #333;
      }

      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }

      .header {
        background-color: #2b2d42;
        color: #ffffff;
        padding: 20px;
        text-align: center;
      }

      .content {
        padding: 24px;
      }

      .content h2 {
        color: #d90429;
        margin-bottom: 16px;
      }

      .admin-section {
        margin-bottom: 20px;
      }

      .admin-section h3 {
        margin-bottom: 8px;
        color: #2b2d42;
      }

      .blog-list {
        padding-left: 20px;
      }

      .blog-list li {
        margin-bottom: 6px;
        font-size: 15px;
      }

      .footer {
        padding: 16px;
        text-align: center;
        font-size: 14px;
        color: #888;
        background-color: #f0f0f0;
      }

      .blogtitle, .blog-list {
        display: inline;
      }

      @media only screen and (max-width: 600px) {
        .container {
          border-radius: 0;
        }

        .content, .header, .footer {
          padding: 16px;
        }

        .content h2 {
          font-size: 20px;
        }
      }
    </style>
  </head>

  <body>
    <div class="container">
      <div class="header">
        <h1>🚨 Draft Blog Summary</h1>
      </div>
      <div class="content">
        <h2>Pending Drafts by Admins</h2>
        <p>Here is the list of admins who have pending blog drafts for more than <strong>4 days</strong>:</p>

        ${summaryData.map(admin => `
          <div class="admin-section">
            <h3>${admin.adminName} – ${admin.drafts.length} draft(s)</h3>
            <p class="blogtitle">Blog Title:</p>
            <ul class="blog-list">
              ${admin.drafts.map(draft => `<li>${draft.title}</li>`).join('')}
            </ul>
          </div>
        `).join('')}

        <p>Please follow up with the respective admins to ensure the blogs are reviewed and published on time.</p>
      </div>
      <div class="footer">
        CMS Notification System &middot; Do not reply to this email
      </div>
    </div>
  </body>
  </html>
`;

module.exports = generateDraftReminderEmail;