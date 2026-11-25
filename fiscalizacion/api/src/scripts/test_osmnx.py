import osmnx as ox
import networkx as nx

# Configure osmnx
ox.settings.log_console = True
ox.settings.use_cache = True

print("Downloading graph...")
# Almirante Brown, Partido de Almirante Brown, Buenos Aires, Argentina
place_name = "Almirante Brown, Buenos Aires, Argentina"
G = ox.graph_from_place(place_name, network_type='drive')

print(f"Graph downloaded with {len(G.nodes)} nodes and {len(G.edges)} edges.")

# Let's find an intersection: Estrada y Arturo Illia
# We need to iterate over edges to find those matching the street names
def find_intersection(G, street1, street2):
    # Get all edges
    edges = ox.graph_to_gdfs(G, nodes=False, edges=True)
    
    # Filter edges by street name (fuzzy or exact)
    # The 'name' column can be a list or a string
    def name_match(edge_name, target):
        if not isinstance(edge_name, str):
            if isinstance(edge_name, list):
                return any(target.lower() in str(n).lower() for n in edge_name)
            return False
        return target.lower() in edge_name.lower()
    
    edges_s1 = edges[edges['name'].apply(lambda n: name_match(n, street1))]
    edges_s2 = edges[edges['name'].apply(lambda n: name_match(n, street2))]
    
    if edges_s1.empty or edges_s2.empty:
        return None
        
    # Get nodes belonging to these edges
    nodes_s1 = set(edges_s1.index.get_level_values('u')).union(set(edges_s1.index.get_level_values('v')))
    nodes_s2 = set(edges_s2.index.get_level_values('u')).union(set(edges_s2.index.get_level_values('v')))
    
    # Find common nodes
    common_nodes = nodes_s1.intersection(nodes_s2)
    
    if not common_nodes:
        return None
        
    # Get coordinates of the first common node
    node_id = list(common_nodes)[0]
    nodes_gdf = ox.graph_to_gdfs(G, nodes=True, edges=False)
    point = nodes_gdf.loc[node_id]
    
    return point.y, point.x

print("Testing Estrada y Arturo Illia...")
res = find_intersection(G, "Estrada", "Arturo Illia")
print(f"Result: {res}")
