import osmnx as ox
import networkx as nx
import os

ox.settings.log_console = True
ox.settings.use_cache = True

graph_file = "brown_graph.graphml"

if not os.path.exists(graph_file):
    print("Downloading Partido de Almirante Brown graph...")
    G = ox.graph_from_place("Partido de Almirante Brown, Buenos Aires, Argentina", network_type='drive')
    ox.save_graphml(G, graph_file)
else:
    print("Loading graph from file...")
    G = ox.load_graphml(graph_file)

print(f"Graph loaded with {len(G.nodes)} nodes and {len(G.edges)} edges.")

def find_intersection(G, street1, street2):
    edges = ox.graph_to_gdfs(G, nodes=False, edges=True)
    
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
        
    nodes_s1 = set(edges_s1.index.get_level_values('u')).union(set(edges_s1.index.get_level_values('v')))
    nodes_s2 = set(edges_s2.index.get_level_values('u')).union(set(edges_s2.index.get_level_values('v')))
    
    common_nodes = nodes_s1.intersection(nodes_s2)
    
    if not common_nodes:
        # Retry with wider fuzzy logic or buffer intersection...
        return None
        
    node_id = list(common_nodes)[0]
    nodes_gdf = ox.graph_to_gdfs(G, nodes=True, edges=False)
    point = nodes_gdf.loc[node_id]
    
    return point.y, point.x

print("Testing Estrada y Arturo Illia...")
res = find_intersection(G, "Estrada", "Arturo Illia")
print(f"Result: {res}")
