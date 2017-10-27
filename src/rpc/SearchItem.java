package rpc;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import db.DBConnection;
import db.DBConnectionFactory;
import entity.Item;
import external.ExternalAPI;
import external.ExternalAPIFactory;
import external.TicketMasterAPI;

/**
 * Servlet implementation class SearchItem
 */
@WebServlet("/search") //代表url的地址path-to-file/...?之前
public class SearchItem extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public SearchItem() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 * search对应的Get请求
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
//		// TODO Auto-generated method stub
//		//Create a PrintWriter from response such that we can add data to response.
//		PrintWriter out = response.getWriter();
//		if (request.getParameter("username") != null) {
//			//Get the username sent from the client
//			String username = request.getParameter("username");
//            //In the output stream, add something to response body. 
//			out.print("Hello " + username);
//		}
//		// Send response back to client 写好的东西传给前端
//		out.flush();
//		out.close();
//		response.setContentType("text/html");
//		PrintWriter out = response.getWriter();
//		out.println("<html><body>");
//		out.println("<h1>This is a HTML page</h1>");
//		out.println("</body></html>");
//		out.flush();
//		out.close();
//		response.setContentType("application/json"); //格式 还有text/html
//		response.addHeader("Access-Control-Allow-Origin", "*"); //返回结果所有人都可以看
//
//		String username = "";
//		if (request.getParameter("username") != null) {
//			username = request.getParameter("username");
//		}
//		JSONObject obj = new JSONObject();
//		try {
//			obj.put("username", username);
//		} catch (JSONException e) {
//			e.printStackTrace();
//		}
//		PrintWriter out = response.getWriter();
//		out.print(obj);
//		out.flush();
//		out.close();
		
//		JSONArray array = new JSONArray();
//		try {
//			array.put(new JSONObject().put("username", "abcd"));
//			array.put(new JSONObject().put("username", "1234"));
//		} catch (JSONException e) {
//			e.printStackTrace();
//		}
//		RpcHelper.writeJsonArray(response, array);
		 // Get parameter from HTTP request
//	    double lat = Double.parseDouble(request.getParameter("lat"));
//	    double lon = Double.parseDouble(request.getParameter("lon"));
//	    String term = request.getParameter("term"); // term can be null
//
//                  // call TicketMasterAPI.search to get event data
//	    ExternalAPI api = ExternalAPIFactory.getExternalAPI();
//	    List<Item> items = api.search(lat, lon, term);
//
//	    // There should be some saveItem logic here
//	    
//	    // Convert Item list back to JSONArray for client
//	    List<JSONObject> list = new ArrayList<>();
//	    try {
//	      for (Item item : items) {
//	        // Add a thin version of restaurant object
//	        JSONObject obj = item.toJSONObject();
//	        list.add(obj);
//	      }
//	    } catch (Exception e) {
//	      e.printStackTrace();
//	    }
//	    JSONArray array = new JSONArray(items);
//      RpcHelper.writeJsonArray(response, array);
		String userId = request.getParameter("user_id");
		double lat = Double.parseDouble(request.getParameter("lat"));
		double lon = Double.parseDouble(request.getParameter("lon"));
		String term = request.getParameter("term"); // Term can be empty or null.
		
		DBConnection conn = DBConnectionFactory.getDBConnection();
		List<Item> items = conn.searchItems(userId, lat, lon, term);
		List<JSONObject> list = new ArrayList<>();

		Set<String> favorite = conn.getFavoriteItemIds(userId);
		try {
			for (Item item : items) {
				JSONObject obj = item.toJSONObject();
				if (favorite != null) {
					obj.put("favorite", favorite.contains(item.getItemId()));
				}
				list.add(obj);
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		JSONArray array = new JSONArray(list);
	    RpcHelper.writeJsonArray(response, array);
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 * search对应的Post请求
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		doGet(request, response);
	}

}
