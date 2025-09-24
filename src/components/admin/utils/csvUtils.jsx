/**
 * Generate CSV content for different data types
 * @param {Array} data - Array of objects to convert to CSV
 * @param {string} type - Type of data (members, loans, groups)
 * @returns {string} CSV content
 */
export const generateCSV = (data, type) => {
  if (!data || data.length === 0) return "";
  
  let headers = [];
  let rows = [];
  
  switch (type) {
    case "members":
      headers = ["ID", "Name", "Group", "Location", "Status", "Phone", "Joined Date"];
      rows = data.map(member => [
        member.id,
        member.user?.full_name || member.user?.username || "N/A",
        member.group?.name || "N/A",
        member.group?.location || "N/A",
        member.status, // This is the member status, not group location
        member.user?.nominee_phone || member.nominee_phone || "N/A", // Use nominee_phone instead of emergency_phone
        member.joined_date ? new Date(member.joined_date).toLocaleDateString() : "N/A" // Use joined_date instead of created_at
      ]);
      break;
      
    case "loans":
      headers = ["ID", "Member", "Group", "Amount", "Status", "Created Date", "Due Date"];
      rows = data.map(loan => [
        loan.id,
        loan.member?.user?.full_name || loan.member?.user?.username || "N/A",
        loan.group?.name || "N/A",
        loan.loan_amount || "N/A", // Use loan_amount instead of amount
        loan.status,
        loan.created_at ? new Date(loan.created_at).toLocaleDateString() : "N/A",
        loan.due_date ? new Date(loan.due_date).toLocaleDateString() : "N/A"
      ]);
      break;
      
    case "groups":
      headers = ["ID", "Name", "Location", "Members Count", "Team Leader", "Bill Collector", "Status"];
      rows = data.map(group => [
        group.id,
        group.name,
        group.location,
        group.member_count || 0,
        group.team_leader?.full_name || group.team_leader?.username || "Not assigned", // Remove ID prefix
        group.bill_collector?.full_name || group.bill_collector?.username || "Not assigned",
        group.status
      ]);
      break;
      
    default:
      return "";
  }
  
  const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
  return csvContent;
};

/**
 * Download CSV content as a file
 * @param {string} content - CSV content
 * @param {string} filename - Name of the file to download
 */
export const downloadCSV = (content, filename) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate filename with current date
 * @param {string} reportType - Type of report
 * @param {string} date - Date string
 * @returns {string} Formatted filename
 */
export const generateFilename = (reportType, date) => {
  const reportTitle = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
  return `${reportTitle}_${date}.csv`;
};
